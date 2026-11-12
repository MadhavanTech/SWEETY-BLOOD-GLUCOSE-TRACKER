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

async function assertCanSave(userId, reading, excludedReadingId) {
  const values = [userId, reading.date, reading.category];
  const excludedReading = excludedReadingId === undefined
    ? ''
    : ` AND id <> $${values.push(excludedReadingId)}`;
  const { rows } = await pool.query(
    `SELECT COUNT(*)::INTEGER AS daily_count,
            COUNT(*) FILTER (WHERE measurement_category = $3)::INTEGER AS slot_count
     FROM glucose_readings
     WHERE user_id = $1 AND reading_date = $2${excludedReading}`,
    values,
  );
  const dailyCount = Number(rows[0].daily_count);
  const slotCount = Number(rows[0].slot_count);

  if (slotCount > 0) {
    throw new AppError('A reading already exists for this time slot on this date.', 409);
  }
  if (dailyCount >= 4) {
    throw new AppError('No more than four readings can be saved per day.', 400);
  }
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
  await assertCanSave(userId, reading);
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
  const existingReading = await get(userId, readingId);
  const keepsSameSlot = existingReading.date === reading.date
    && existingReading.category === reading.category;
  if (!keepsSameSlot) {
    await assertCanSave(userId, reading, readingId);
  }
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
