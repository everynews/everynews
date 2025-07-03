import { Checkbox } from '@everynews/components/ui/checkbox'
import { FormControl, FormItem, FormLabel } from '@everynews/components/ui/form'
import { getHourIntervalLabel, getUserTimezone } from '@everynews/lib/timezone'
import { DAYS_OF_WEEK, HOURS_2_INTERVAL } from './constants'

interface SchedulePickerProps {
  scheduleDays: string[]
  setScheduleDays: (days: string[]) => void
  scheduleHours: number[]
  setScheduleHours: (hours: number[]) => void
}

export const SchedulePicker = ({
  scheduleDays,
  setScheduleDays,
  scheduleHours,
  setScheduleHours,
}: SchedulePickerProps) => {
  const timezone = getUserTimezone()

  const handleDayToggle = (day: string) => {
    setScheduleDays(
      scheduleDays.includes(day)
        ? scheduleDays.filter((d) => d !== day)
        : [...scheduleDays, day],
    )
  }

  const handleHourToggle = (hour: number) => {
    setScheduleHours(
      scheduleHours.includes(hour)
        ? scheduleHours.filter((h) => h !== hour)
        : [...scheduleHours, hour],
    )
  }

  return (
    <div className='space-y-4'>
      <div>
        <FormLabel>Days of the week</FormLabel>
        <div className='mt-2 space-y-2'>
          {DAYS_OF_WEEK.map((day) => (
            <FormItem
              key={day}
              className='flex flex-row items-start space-x-3 space-y-0'
            >
              <FormControl>
                <Checkbox
                  checked={scheduleDays.includes(day)}
                  onCheckedChange={() => handleDayToggle(day)}
                />
              </FormControl>
              <FormLabel className='font-normal'>{day}</FormLabel>
            </FormItem>
          ))}
        </div>
      </div>

      <div>
        <FormLabel>Time of day ({timezone})</FormLabel>
        <div className='mt-2 grid grid-cols-3 gap-2'>
          {HOURS_2_INTERVAL.map((hour) => (
            <FormItem
              key={hour}
              className='flex flex-row items-start space-x-3 space-y-0'
            >
              <FormControl>
                <Checkbox
                  checked={scheduleHours.includes(hour)}
                  onCheckedChange={() => handleHourToggle(hour)}
                />
              </FormControl>
              <FormLabel className='font-normal'>
                {getHourIntervalLabel(hour)}
              </FormLabel>
            </FormItem>
          ))}
        </div>
      </div>
    </div>
  )
}
