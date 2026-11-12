const pool = require('../config/db');
const AppError = require('../utils/AppError');

const categoryLabels = {
  morning_fasting: 'Morning (Fasting)',
  after_breakfast: 'After Breakfast',
  after_lunch: 'After Lunch',
  after_dinner: 'After Dinner',
};

function toDateString(value) {
  if (!value) return value;
  if (value instanceof Date) {
    return [
      value.getUTCFullYear(),
      String(value.getUTCMonth() + 1).padStart(2, '0'),
      String(value.getUTCDate()).padStart(2, '0'),
    ].join('-');
  }
  if (typeof value === 'string') {
    return value.slice(0, 10);
  }
  return value;
}

function serializeReading(row) {
  return {
    id: row.id,
    date: toDateString(row.reading_date),
    time: String(row.reading_time ?? '').slice(0, 5),
    category: row.measurement_category,
    slot: categoryLabels[row.measurement_category],
    value: Number(row.glucose_value),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function list(userId, { startDate, endDate } = {}) {
  const values = [userId];
  let dateFilter = '';

  if (startDate) {
    values.push(startDate);
    dateFilter += ` AND reading_date >= $${values.length}`;
  }
  if (endDate) {
    values.push(endDate);
    dateFilter += ` AND reading_date <= $${values.length}`;
  }

  const { rows } = await pool.query(
    `SELECT id, reading_date, reading_time, measurement_category, glucose_value, created_at, updated_at
     FROM glucose_readings
     WHERE user_id = $1${dateFilter}
     ORDER BY reading_date DESC, reading_time DESC, id DESC
     LIMIT 1000`,
    values,
  );
  return rows.map(serializeReading);
}

async function create(userId, reading) {
  const { rows } = await pool.query(
    `INSERT INTO glucose_readings
       (user_id, glucose_value, measurement_category, reading_date, reading_time)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, reading_date, reading_time, measurement_category, glucose_value, created_at, updated_at`,
    [userId, reading.value, reading.category, reading.date, reading.time],
  );
  return serializeReading(rows[0]);
}

async function get(userId, readingId) {
  const { rows } = await pool.query(
    `SELECT id, reading_date, reading_time, measurement_category, glucose_value, created_at, updated_at
     FROM glucose_readings
     WHERE id = $1 AND user_id = $2`,
    [readingId, userId],
  );
  if (!rows[0]) {
    throw new AppError('Reading not found.', 404);
  }
  return serializeReading(rows[0]);
}

async function update(userId, readingId, reading) {
  const { rows } = await pool.query(
    `UPDATE glucose_readings
     SET glucose_value = $1, measurement_category = $2, reading_date = $3, reading_time = $4
     WHERE id = $5 AND user_id = $6
     RETURNING id, reading_date, reading_time, measurement_category, glucose_value, created_at, updated_at`,
    [reading.value, reading.category, reading.date, reading.time, readingId, userId],
  );
  if (!rows[0]) {
    throw new AppError('Reading not found.', 404);
  }
  return serializeReading(rows[0]);
}

async function remove(userId, readingId) {
  const { rowCount } = await pool.query(
    'DELETE FROM glucose_readings WHERE id = $1 AND user_id = $2',
    [readingId, userId],
  );
  if (!rowCount) {
    throw new AppError('Reading not found.', 404);
  }
}

module.exports = { list, get, create, update, remove };
