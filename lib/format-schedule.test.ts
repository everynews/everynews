import { describe, expect, it } from 'bun:test'
import { formatSchedule } from './format-schedule'

describe('formatSchedule', () => {
  describe('days formatting', () => {
    it('should format all 7 days as "Everyday"', () => {
      const schedule = JSON.stringify({
        days: [
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
          'Sunday',
        ],
        hours: [9],
      })
      expect(formatSchedule(schedule)).toBe('Everyday at 9AM UTC')
    })

    it('should format weekdays as "Weekdays"', () => {
      const schedule = JSON.stringify({
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        hours: [9],
      })
      expect(formatSchedule(schedule)).toBe('Weekdays at 9AM UTC')
    })

    it('should format weekdays in any order as "Weekdays"', () => {
      const schedule = JSON.stringify({
        days: ['Friday', 'Monday', 'Thursday', 'Tuesday', 'Wednesday'],
        hours: [9],
      })
      expect(formatSchedule(schedule)).toBe('Weekdays at 9AM UTC')
    })

    it('should format weekends as "Weekends"', () => {
      const schedule = JSON.stringify({
        days: ['Saturday', 'Sunday'],
        hours: [9],
      })
      expect(formatSchedule(schedule)).toBe('Weekends at 9AM UTC')
    })

    it('should format single day by name', () => {
      const schedule = JSON.stringify({
        days: ['Monday'],
        hours: [9],
      })
      expect(formatSchedule(schedule)).toBe('Monday at 9AM UTC')
    })

    it('should format multiple non-special days as comma-separated list', () => {
      const schedule = JSON.stringify({
        days: ['Monday', 'Wednesday', 'Friday'],
        hours: [9],
      })
      expect(formatSchedule(schedule)).toBe(
        'Monday, Wednesday, Friday at 9AM UTC',
      )
    })

    it('should handle empty days array', () => {
      const schedule = JSON.stringify({
        days: [],
        hours: [9],
      })
      expect(formatSchedule(schedule)).toBe(' at 9AM UTC')
    })
  })

  describe('hours formatting', () => {
    it('should format midnight as 12AM', () => {
      const schedule = JSON.stringify({
        days: ['Monday'],
        hours: [0],
      })
      expect(formatSchedule(schedule)).toBe('Monday at 12AM UTC')
    })

    it('should format noon as 12PM', () => {
      const schedule = JSON.stringify({
        days: ['Monday'],
        hours: [12],
      })
      expect(formatSchedule(schedule)).toBe('Monday at 12PM UTC')
    })

    it('should format morning hours correctly', () => {
      const schedule = JSON.stringify({
        days: ['Monday'],
        hours: [1, 5, 11],
      })
      expect(formatSchedule(schedule)).toBe('Monday at 1AM, 5AM, 11AM UTC')
    })

    it('should format afternoon/evening hours correctly', () => {
      const schedule = JSON.stringify({
        days: ['Monday'],
        hours: [13, 17, 23],
      })
      expect(formatSchedule(schedule)).toBe('Monday at 1PM, 5PM, 11PM UTC')
    })

    it('should format single hour with "at"', () => {
      const schedule = JSON.stringify({
        days: ['Monday'],
        hours: [14],
      })
      expect(formatSchedule(schedule)).toBe('Monday at 2PM UTC')
    })

    it('should format multiple hours with comma separation', () => {
      const schedule = JSON.stringify({
        days: ['Monday'],
        hours: [9, 12, 15],
      })
      expect(formatSchedule(schedule)).toBe('Monday at 9AM, 12PM, 3PM UTC')
    })

    it('should handle empty hours array', () => {
      const schedule = JSON.stringify({
        days: ['Monday'],
        hours: [],
      })
      expect(formatSchedule(schedule)).toBe('Monday at  UTC')
    })

    it('should handle 24-hour edge case', () => {
      const schedule = JSON.stringify({
        days: ['Monday'],
        hours: [24],
      })
      expect(formatSchedule(schedule)).toBe('Monday at 12PM UTC')
    })
  })

  describe('combined scenarios', () => {
    it('should format everyday with multiple hours', () => {
      const schedule = JSON.stringify({
        days: [
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
          'Sunday',
        ],
        hours: [9, 13, 17],
      })
      expect(formatSchedule(schedule)).toBe('Everyday at 9AM, 1PM, 5PM UTC')
    })

    it('should format weekdays with multiple hours', () => {
      const schedule = JSON.stringify({
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        hours: [8, 12, 16],
      })
      expect(formatSchedule(schedule)).toBe('Weekdays at 8AM, 12PM, 4PM UTC')
    })

    it('should format weekends with all day hours', () => {
      const schedule = JSON.stringify({
        days: ['Saturday', 'Sunday'],
        hours: [0, 6, 12, 18],
      })
      expect(formatSchedule(schedule)).toBe(
        'Weekends at 12AM, 6AM, 12PM, 6PM UTC',
      )
    })
  })

  describe('error handling', () => {
    it('should return original string if JSON parsing fails', () => {
      const invalidJson = 'not a json string'
      expect(formatSchedule(invalidJson)).toBe('not a json string')
    })

    it('should return original string for invalid JSON structure', () => {
      const invalidJson = '{"invalid": "structure"}'
      expect(formatSchedule(invalidJson)).toBe('{"invalid": "structure"}')
    })

    it('should handle missing days property', () => {
      const schedule = JSON.stringify({
        hours: [9],
      })
      // Should return original string due to error
      expect(formatSchedule(schedule)).toBe(schedule)
    })

    it('should handle missing hours property', () => {
      const schedule = JSON.stringify({
        days: ['Monday'],
      })
      // Should return original string due to error
      expect(formatSchedule(schedule)).toBe(schedule)
    })

    it('should return original string for malformed JSON', () => {
      const malformed = '{"days": ["Monday"], "hours": [9'
      expect(formatSchedule(malformed)).toBe('{"days": ["Monday"], "hours": [9')
    })

    it('should handle null input gracefully', () => {
      const schedule = JSON.stringify(null)
      expect(formatSchedule(schedule)).toBe('null')
    })

    it('should handle empty object', () => {
      const schedule = JSON.stringify({})
      // Should return original string due to error
      expect(formatSchedule(schedule)).toBe(schedule)
    })
  })

  describe('edge cases', () => {
    it('should handle days with typos', () => {
      const schedule = JSON.stringify({
        days: ['Mnday', 'Tuesday'],
        hours: [9],
      })
      expect(formatSchedule(schedule)).toBe('Mnday, Tuesday at 9AM UTC')
    })

    it('should handle numeric hours as strings', () => {
      const schedule = JSON.stringify({
        days: ['Monday'],
        hours: ['9', '10'],
      })
      expect(formatSchedule(schedule)).toBe('Monday at 9AM, 10AM UTC')
    })

    it('should handle very large hour numbers', () => {
      const schedule = JSON.stringify({
        days: ['Monday'],
        hours: [25, 48],
      })
      expect(formatSchedule(schedule)).toBe('Monday at 1PM, 12PM UTC')
    })

    it('should handle negative hour numbers', () => {
      const schedule = JSON.stringify({
        days: ['Monday'],
        hours: [-1, -12],
      })
      expect(formatSchedule(schedule)).toBe('Monday at -1AM, 12AM UTC')
    })

    it('should preserve original case in day names', () => {
      const schedule = JSON.stringify({
        days: ['MONDAY', 'tuesday'],
        hours: [9],
      })
      expect(formatSchedule(schedule)).toBe('MONDAY, tuesday at 9AM UTC')
    })

    it('should handle duplicate days', () => {
      const schedule = JSON.stringify({
        days: ['Monday', 'Monday', 'Tuesday'],
        hours: [9],
      })
      expect(formatSchedule(schedule)).toBe(
        'Monday, Monday, Tuesday at 9AM UTC',
      )
    })

    it('should handle duplicate hours', () => {
      const schedule = JSON.stringify({
        days: ['Monday'],
        hours: [9, 9, 10],
      })
      expect(formatSchedule(schedule)).toBe('Monday at 9AM, 9AM, 10AM UTC')
    })
  })
})
