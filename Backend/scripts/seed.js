const bcrypt = require('bcrypt');
const pool = require('../src/config/db');
const env = require('../src/config/env');
const { dateInTimeZone } = require('../src/utils/reportPeriods');

const DEMO_NAME = 'Sweety Demo';
const DEMO_EMAIL = process.env.DEMO_EMAIL || 'demo@sweety.local';
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'SweetyDemo2026!';
const SALT_ROUNDS = 12;

const sampleReadings = [
  { daysAgo: 0, time: '07:30', category: 'morning_fasting', value: 104 },
  { daysAgo: 0, time: '13:00', category: 'after_lunch', value: 137 },
  { daysAgo: 0, time: '20:00', category: 'after_dinner', value: 128 },
  { daysAgo: 1, time: '07:45', category: 'morning_fasting', value: 99 },
  { daysAgo: 1, time: '12:45', category: 'after_lunch', value: 142 },
  { daysAgo: 1, time: '20:15', category: 'after_dinner', value: 131 },
  { daysAgo: 2, time: '07:20', category: 'morning_fasting', value: 101 },
  { daysAgo: 2, time: '13:10', category: 'after_lunch', value: 135 },
  { daysAgo: 2, time: '20:05', category: 'after_dinner', value: 126 },
  { daysAgo: 3, time: '07:35', category: 'morning_fasting', value: 106 },
  { daysAgo: 3, time: '12:55', category: 'after_lunch', value: 145 },
  { daysAgo: 3, time: '20:10', category: 'after_dinner', value: 133 },
  { daysAgo: 4, time: '07:40', category: 'morning_fasting', value: 98 },
  { daysAgo: 4, time: '13:05', category: 'after_lunch', value: 139 },
  { daysAgo: 4, time: '20:20', category: 'after_dinner', value: 129 },
];

function daysAgo(today, amount) {
  const date = new Date(`${today}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - amount);
  return date.toISOString().slice(0, 10);
}

async function seed() {
  let client;

  try {
    client = await pool.connect();
    await client.query('BEGIN');
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, SALT_ROUNDS);
    const { rows } = await client.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE
       SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash
       RETURNING id`,
      [DEMO_NAME, DEMO_EMAIL.toLowerCase(), passwordHash],
    );
    const userId = rows[0].id;
    const today = dateInTimeZone(new Date(), env.applicationTimeZone);

    for (const reading of sampleReadings) {
      const readingDate = daysAgo(today, reading.daysAgo);
      await client.query(
        `INSERT INTO glucose_readings
           (user_id, glucose_value, measurement_category, reading_date, reading_time)
         SELECT $1::INTEGER, $2::NUMERIC, $3::VARCHAR(30), $4::DATE, $5::TIME
         WHERE NOT EXISTS (
           SELECT 1 FROM glucose_readings
           WHERE user_id = $1::INTEGER
             AND reading_date = $4::DATE
             AND measurement_category = $3::VARCHAR(30)
         )
           AND (SELECT COUNT(*) FROM glucose_readings
                WHERE user_id = $1::INTEGER AND reading_date = $4::DATE) < 4
         ON CONFLICT DO NOTHING`,
        [userId, reading.value, reading.category, readingDate, reading.time],
      );
    }

    await client.query('COMMIT');
    console.log(`Seeded demo account ${DEMO_EMAIL.toLowerCase()} with sample readings.`);
  } catch (error) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Demo seed rollback failed:', rollbackError.message);
      }
    }
    console.error('Demo seed failed:', error.message);
    process.exitCode = 1;
  } finally {
    if (client) client.release();
    try {
      await pool.end();
    } catch (closeError) {
      console.error('Failed to close the seed database pool:', closeError.message);
      process.exitCode = 1;
    }
  }
}

seed();
