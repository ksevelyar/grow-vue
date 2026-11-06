export function calculateGrowLogProgress(startedAt, progressAt, timezone = 'UTC') {
  const startingDate = getCalendarDateParts(startedAt, timezone)
  const progressDate = getCalendarDateParts(progressAt, timezone)
  const millisecondsPerCalendarDay = 86_400_000
  const startingCalendarDay = Date.UTC(startingDate.year, startingDate.month - 1, startingDate.day)
  const progressCalendarDay = Date.UTC(progressDate.year, progressDate.month - 1, progressDate.day)
  const elapsedCalendarDays = Math.floor(
    (progressCalendarDay - startingCalendarDay) / millisecondsPerCalendarDay,
  )
  const dayNumber = Math.max(elapsedCalendarDays + 1, 1)
  const weekNumber = Math.ceil(dayNumber / 7)

  return { dayNumber, weekNumber }
}

export function getCurrentDate(timezone = 'UTC') {
  const dateParts = getCalendarDateParts(new Date(), timezone)

  return `${String(dateParts.year).padStart(4, '0')}-${String(dateParts.month).padStart(2, '0')}-${String(dateParts.day).padStart(2, '0')}`
}

export function convertTimestampToDate(timestamp) {
  return new Date(timestamp).toISOString().slice(0, 10)
}

export function convertDateToTimestamp(dateValue) {
  return new Date(`${dateValue}T00:00:00.000Z`).toISOString()
}

export function formatDate(timestamp) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(timestamp))
}

function getCalendarDateParts(dateValue, timezone) {
  if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    const [year, month, day] = dateValue.split('-').map(Number)
    return { year, month, day }
  }

  const dateParts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(dateValue))

  return Object.fromEntries(dateParts.map(({ type, value }) => [type, Number(value)]))
}
