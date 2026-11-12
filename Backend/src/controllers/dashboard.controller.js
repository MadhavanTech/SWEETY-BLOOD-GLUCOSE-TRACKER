const readingsService = require('../services/readings.service');

function dateDaysAgo(days) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - days);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

async function getDashboard(req, res) {
  const readings = await readingsService.list(req.user.id);
  const today = dateDaysAgo(0);
  const currentStart = dateDaysAgo(6);
  const previousStart = dateDaysAgo(13);
  const previousEnd = dateDaysAgo(7);
  const latest = readings[0] || null;
  const recent = readings.slice(0, 7);
  const currentWeek = readings.filter((reading) => reading.date >= currentStart && reading.date <= today);
  const previousWeek = readings.filter((reading) => reading.date >= previousStart && reading.date <= previousEnd);
  const average = (items) => items.length
    ? items.reduce((sum, item) => sum + item.value, 0) / items.length
    : null;
  const currentAverage = average(currentWeek);
  const previousAverage = average(previousWeek);

  return res.json({
    success: true,
    data: {
      latestReading: latest,
      averageRecent: average(recent),
      currentWeek: { total: currentWeek.length, average: currentAverage },
      previousWeek: { total: previousWeek.length, average: previousAverage },
      readings,
    },
  });
}

module.exports = { getDashboard };
