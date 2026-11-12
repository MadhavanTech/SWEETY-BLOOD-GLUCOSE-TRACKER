const pool = require('../config/db');

function formatDate(value) {
  if (value instanceof Date) {
    return [
      value.getUTCFullYear(),
      String(value.getUTCMonth() + 1).padStart(2, '0'),
      String(value.getUTCDate()).padStart(2, '0'),
    ].join('-');
  }
  return String(value).slice(0, 10);
}

function formatTime(value) {
  return String(value ?? '').slice(0, 5);
}

async function getReport(userId, { startDate, endDate }) {
  const { rows } = await pool.query(
    `SELECT id, reading_date, reading_time, measurement_category, glucose_value,
            COUNT(*) OVER () AS total_readings,
            ROUND(AVG(glucose_value) OVER (), 1) AS average,
            MAX(glucose_value) OVER () AS highest,
            MIN(glucose_value) OVER () AS lowest
     FROM glucose_readings
     WHERE user_id = $1 AND reading_date >= $2 AND reading_date <= $3
     ORDER BY reading_date DESC, reading_time DESC, id DESC`,
    [userId, startDate, endDate],
  );

  const first = rows[0];
  return {
    summary: {
      highest: first ? Number(first.highest) : null,
      lowest: first ? Number(first.lowest) : null,
      average: first ? Number(first.average) : null,
      totalReadings: first ? Number(first.total_readings) : 0,
    },
    readings: rows.map((row) => ({
      id: row.id,
      reading_date: formatDate(row.reading_date),
      reading_time: formatTime(row.reading_time),
      measurement_category: row.measurement_category,
      glucose_value: Number(row.glucose_value),
    })),
  };
}

module.exports = { getReport };
