// Convert UTC hour to local hour
export const utcToLocal = (utcHour: number): number => {
  const now = new Date()
  now.setUTCHours(utcHour, 0, 0, 0)
  return now.getHours()
}

// Convert local hour to UTC hour
export const localToUtc = (localHour: number): number => {
  const now = new Date()
  now.setHours(localHour, 0, 0, 0)
  return now.getUTCHours()
}

// Get display label for hour (already in local time)
export const getHourLabel = (localHour: number): string => {
  const period = localHour < 12 ? 'AM' : 'PM'
  const displayHour = localHour % 12 === 0 ? 12 : localHour % 12
  return `${displayHour} ${period}`
}
