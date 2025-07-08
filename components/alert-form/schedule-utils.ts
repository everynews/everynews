interface ScheduleData {
  days: string[]
  hours: number[]
}

export const parseScheduleValue = (
  value: string | ScheduleData,
): ScheduleData => {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return { days: [], hours: [] }
    }
  }
  return value
}

export const stringifySchedule = (data: ScheduleData): string => {
  return JSON.stringify(data)
}
