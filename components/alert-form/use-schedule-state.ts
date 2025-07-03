import type { AlertDto } from '@everynews/schema/alert'
import { useEffect, useState } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { parseScheduleValue, stringifySchedule } from './schedule-utils'

export const useScheduleState = (
  form: UseFormReturn<AlertDto>,
  initialSchedule?: string | { days: string[]; hours: number[] },
) => {
  const [scheduleDays, setScheduleDays] = useState<string[]>([])
  const [scheduleHours, setScheduleHours] = useState<number[]>([])

  // Initialize schedule state from initial data
  useEffect(() => {
    if (initialSchedule) {
      const parsed = parseScheduleValue(initialSchedule)
      setScheduleDays(parsed.days || [])
      setScheduleHours(parsed.hours || [])
    }
  }, [initialSchedule])

  const updateScheduleDays = (days: string[]) => {
    setScheduleDays(days)
    form.setValue('wait', {
      type: 'schedule',
      value: stringifySchedule({ days, hours: scheduleHours }),
    })
  }

  const updateScheduleHours = (hours: number[]) => {
    setScheduleHours(hours)
    form.setValue('wait', {
      type: 'schedule',
      value: stringifySchedule({ days: scheduleDays, hours }),
    })
  }

  const toggleDay = (day: string) => {
    const next = scheduleDays.includes(day)
      ? scheduleDays.filter((d) => d !== day)
      : [...scheduleDays, day]
    updateScheduleDays(next)
  }

  const toggleHour = (hour: number) => {
    const next = scheduleHours.includes(hour)
      ? scheduleHours.filter((h) => h !== hour)
      : [...scheduleHours, hour]
    updateScheduleHours(next)
  }

  return {
    scheduleDays,
    scheduleHours,
    toggleDay,
    toggleHour,
    updateScheduleDays,
    updateScheduleHours,
  }
}
