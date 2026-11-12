function dateInTimeZone(instant, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instant);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function isLeapYear(year) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function daysInMonth(year, month) {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

function getMonthToDatePeriod(today) {
  return {
    startDate: `${today.slice(0, 7)}-01`,
    endDate: today,
  };
}

function getPreviousMonthPeriod(today) {
  let [year, month] = today.split('-').map(Number);
  month -= 1;
  if (month === 0) {
    month = 12;
    year -= 1;
  }
  const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
  return {
    startDate: `${monthPrefix}-01`,
    endDate: `${monthPrefix}-${String(daysInMonth(year, month)).padStart(2, '0')}`,
  };
}

module.exports = {
  dateInTimeZone,
  getMonthToDatePeriod,
  getPreviousMonthPeriod,
};
