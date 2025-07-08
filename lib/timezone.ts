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
const getHourLabel = (localHour: number): string => {
  // Normalize hour to 0-23 range
  const normalizedHour = ((localHour % 24) + 24) % 24
  const displayHour = normalizedHour % 12 === 0 ? 12 : normalizedHour % 12
  const period = normalizedHour >= 12 ? 'pm' : 'am'
  return `${displayHour}${period}`
}

// Get display label for hour interval (already in local time)
export const getHourIntervalLabel = (startHour: number): string => {
  const startDisplayHour = getHourLabel(startHour)

  const endHour = (startHour + 1) % 24
  const endDisplayHour = getHourLabel(endHour)

  return `${startDisplayHour}-${endDisplayHour}`
}

// Get user's timezone name
export const getUserTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}
