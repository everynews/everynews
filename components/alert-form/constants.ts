export const STRATEGY_WITH_QUERY = ['google']

export const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const

export const HOURS_2_INTERVAL = Array.from({ length: 12 }, (_, i) => i * 2) // 0-22
