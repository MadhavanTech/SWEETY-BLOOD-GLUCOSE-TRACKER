const pool = require('../config/db');
const env = require('../config/env');
const reportsService = require('../services/reports.service');
const { reportQuerySchema, dailyReportDateSchema } = require('../validators/schemas');
const { list } = require('../services/readings.service');
const {
  dateInTimeZone,
  getMonthToDatePeriod,
  getPreviousMonthPeriod,
} = require('../utils/reportPeriods');

async function sendPeriodReport(req, res, reportType, period) {
  const report = await reportsService.getReport(req.user.id, period);
  return res.json({
    success: true,
    data: {
      reportType,
      period,
      ...report,
    },
  });
}

async function getDailyReport(req, res) {
  const date = dailyReportDateSchema.parse(req.query.date);
  return sendPeriodReport(req, res, 'daily', {
    startDate: date,
    endDate: date,
  });
}

async function getMonthToDateReport(req, res) {
  const today = dateInTimeZone(new Date(), env.applicationTimeZone);
  return sendPeriodReport(req, res, 'month-to-date', getMonthToDatePeriod(today));
}

async function getPreviousMonthReport(req, res) {
  const today = dateInTimeZone(new Date(), env.applicationTimeZone);
  return sendPeriodReport(req, res, 'previous-month', getPreviousMonthPeriod(today));
}

async function getReport(req, res) {
  const { startDate, endDate } = reportQuerySchema.parse(req.query);
  const { rows } = await pool.query(
    `SELECT COUNT(*)::INTEGER AS total,
            ROUND(AVG(glucose_value), 1) AS average,
            MAX(glucose_value) AS highest,
            MIN(glucose_value) AS lowest
     FROM glucose_readings
     WHERE user_id = $1 AND reading_date >= $2 AND reading_date <= $3`,
    [req.user.id, startDate, endDate],
  );
  const readings = await list(req.user.id, { startDate, endDate });
  const summary = rows[0];

  return res.json({
    success: true,
    data: {
      startDate,
      endDate,
      total: summary.total,
      average: summary.average === null ? null : Number(summary.average),
      highest: summary.highest === null ? null : Number(summary.highest),
      lowest: summary.lowest === null ? null : Number(summary.lowest),
      readings,
    },
  });
}

module.exports = {
  getReport,
  getDailyReport,
  getMonthToDateReport,
  getPreviousMonthReport,
};
