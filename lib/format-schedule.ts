export function formatSchedule(scheduleString: string): string {
  try {
    const schedule = JSON.parse(scheduleString)
    const { days, hours } = schedule

    // Format days
    let daysText = ''
    if (days.length === 7) {
      daysText = 'Everyday'
    } else if (
      days.length === 5 &&
      days.includes('Monday') &&
      days.includes('Tuesday') &&
      days.includes('Wednesday') &&
      days.includes('Thursday') &&
      days.includes('Friday')
    ) {
      daysText = 'Weekdays'
    } else if (
      days.length === 2 &&
      days.includes('Saturday') &&
      days.includes('Sunday')
    ) {
      daysText = 'Weekends'
    } else if (days.length === 1) {
      daysText = days[0]
    } else {
      daysText = days.join(', ')
    }

    // Format hours
    const hoursText = hours
      .map((hour: number) => {
        const period = hour < 12 ? 'AM' : 'PM'
        const displayHour = hour % 12 === 0 ? 12 : hour % 12
        return `${displayHour}${period}`
      })
      .join(', ')

    // Special case for single hour
    if (hours.length === 1) {
      const hour = hours[0]
      const period = hour < 12 ? 'AM' : 'PM'
      const displayHour = hour % 12 === 0 ? 12 : hour % 12
      return `${daysText} at ${displayHour}${period} UTC`
    }

    return `${daysText} at ${hoursText} UTC`
  } catch {
    // If parsing fails, return the original string
    return scheduleString
  }
}
