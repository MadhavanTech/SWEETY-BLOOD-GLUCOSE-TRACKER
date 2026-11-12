export const formatReadingDate = (date) => {
  if (!date) return '—'
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`))
}

export const todayAsInputDate = () => {
  const today = new Date()
  const offset = today.getTimezoneOffset()
  return new Date(today.getTime() - offset * 60_000).toISOString().slice(0, 10)
}

export const sortReadingsNewestFirst = (readings) =>
  [...readings].sort((a, b) => {
    const dateOrder = b.date.localeCompare(a.date)
    if (dateOrder) return dateOrder
    const timeOrder = (b.time || '').localeCompare(a.time || '')
    return timeOrder || b.id - a.id
  })
