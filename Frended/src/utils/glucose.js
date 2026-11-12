import doctorIcon from '../assets/docter.png'
import drinksIcon from '../assets/drinks.png'
import waterBottleIcon from '../assets/water-bottle.png'
import { todayAsInputDate } from './readings'

export const getReadingSuggestion = (value) => {
  if (value < 54) {
    return {
      status: 'Severe Low',
      className: 'severe_low',
      text: 'Seek urgent medical help.',
      image: doctorIcon,
      alt: 'Contact a doctor',
    }
  }
  if (value <= 69) {
    return {
      status: 'Low',
      className: 'low',
      text: 'Follow your care plan and contact your doctor.',
      image: doctorIcon,
      alt: 'Contact a doctor',
    }
  }
  if (value <= 180) {
    return {
      status: 'In Target',
      className: 'in_target',
      text: 'Drink water.',
      image: waterBottleIcon,
      alt: 'Water bottle',
    }
  }
  if (value <= 250) {
    return {
      status: 'High',
      className: 'high',
      text: 'Avoid sugary drinks and follow your care plan.',
      image: drinksIcon,
      alt: 'Sugary drink crossed out',
    }
  }
  if (value <= 299) {
    return {
      status: 'Very High',
      className: 'very_high',
      text: 'Contact your doctor promptly.',
      image: doctorIcon,
      alt: 'Contact a doctor',
    }
  }
  return {
    status: 'Critical',
    className: 'critical',
    text: 'Seek urgent medical care now.',
    image: doctorIcon,
    alt: 'Contact a doctor',
  }
}

const isLeapYear = (year) => year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)

const daysInMonth = (year, month) => {
  if (month === 2) return isLeapYear(year) ? 29 : 28
  return [4, 6, 9, 11].includes(month) ? 30 : 31
}

export const getMonthStartDate = (date) => `${date.slice(0, 7)}-01`

export const getPreviousMonthDateRange = (date) => {
  let [year, month] = date.split('-').map(Number)
  month -= 1
  if (month === 0) {
    month = 12
    year -= 1
  }
  const monthString = `${year}-${String(month).padStart(2, '0')}`
  return {
    startDate: `${monthString}-01`,
    endDate: `${monthString}-${String(daysInMonth(year, month)).padStart(2, '0')}`,
  }
}

export const addDaysToInputDate = (date, amount) => {
  let [year, month, day] = date.split('-').map(Number)
  let remainingDays = Math.trunc(amount)

  while (remainingDays > 0) {
    const daysLeftInMonth = daysInMonth(year, month) - day
    if (remainingDays <= daysLeftInMonth) {
      day += remainingDays
      remainingDays = 0
    } else {
      remainingDays -= daysLeftInMonth + 1
      day = 1
      month += 1
      if (month > 12) {
        month = 1
        year += 1
      }
    }
  }

  while (remainingDays < 0) {
    if (day + remainingDays > 0) {
      day += remainingDays
      remainingDays = 0
    } else {
      remainingDays += day
      month -= 1
      if (month < 1) {
        month = 12
        year -= 1
      }
      day = daysInMonth(year, month)
    }
  }

  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export const daysAgoAsInputDate = (daysAgo) =>
  addDaysToInputDate(todayAsInputDate(), -daysAgo)

export const dateToOrdinal = (date) => {
  const [year, month, day] = date.split('-').map(Number)
  const previousYear = year - 1
  const daysBeforeMonth = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
  const leapDay = month > 2 && isLeapYear(year) ? 1 : 0
  return previousYear * 365
    + Math.floor(previousYear / 4)
    - Math.floor(previousYear / 100)
    + Math.floor(previousYear / 400)
    + daysBeforeMonth[month - 1]
    + leapDay
    + day
}

export const formatChartDate = (date) =>
  new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' })
    .format(new Date(`${date}T00:00:00`))
