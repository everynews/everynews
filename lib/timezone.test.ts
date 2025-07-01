import { beforeAll, describe, expect, it } from 'bun:test'
import {
  getHourIntervalLabel,
  getHourLabel,
  getUserTimezone,
  localToUtc,
  utcToLocal,
} from './timezone'

describe('timezone', () => {
  let originalDate: typeof Date

  beforeAll(() => {
    // Store original Date constructor
    originalDate = global.Date
  })

  describe('utcToLocal', () => {
    it('should convert UTC hour to local hour', () => {
      // This test depends on the local timezone where tests are run
      // We'll just verify the function returns valid hours
      const result = utcToLocal(0)
      expect(result).toBeGreaterThanOrEqual(0)
      expect(result).toBeLessThan(24)
    })

    it('should handle all 24 hours', () => {
      const results: number[] = []
      for (let hour = 0; hour < 24; hour++) {
        const localHour = utcToLocal(hour)
        results.push(localHour)
        expect(localHour).toBeGreaterThanOrEqual(0)
        expect(localHour).toBeLessThan(24)
      }
      // Should have 24 results
      expect(results).toHaveLength(24)
    })

    it('should handle edge cases', () => {
      // Hours beyond 24
      const result1 = utcToLocal(25)
      expect(result1).toBeGreaterThanOrEqual(0)
      expect(result1).toBeLessThan(24)

      // Negative hours
      const result2 = utcToLocal(-1)
      expect(result2).toBeGreaterThanOrEqual(0)
      expect(result2).toBeLessThan(24)
    })
  })

  describe('localToUtc', () => {
    it('should convert local hour to UTC hour', () => {
      // This test depends on the local timezone where tests are run
      // We'll just verify the function returns valid hours
      const result = localToUtc(0)
      expect(result).toBeGreaterThanOrEqual(0)
      expect(result).toBeLessThan(24)
    })

    it('should handle all 24 hours', () => {
      const results: number[] = []
      for (let hour = 0; hour < 24; hour++) {
        const utcHour = localToUtc(hour)
        results.push(utcHour)
        expect(utcHour).toBeGreaterThanOrEqual(0)
        expect(utcHour).toBeLessThan(24)
      }
      // Should have 24 results
      expect(results).toHaveLength(24)
    })

    it('should be inverse of utcToLocal', () => {
      // Test that converting back and forth gives consistent results
      for (let hour = 0; hour < 24; hour++) {
        const local = utcToLocal(hour)
        const backToUtc = localToUtc(local)
        // Due to date boundaries, we need to handle wraparound
        expect([hour, (hour + 24) % 24, (hour - 24 + 48) % 24]).toContain(
          backToUtc,
        )
      }
    })

    it('should handle edge cases', () => {
      // Hours beyond 24
      const result1 = localToUtc(25)
      expect(result1).toBeGreaterThanOrEqual(0)
      expect(result1).toBeLessThan(24)

      // Negative hours
      const result2 = localToUtc(-1)
      expect(result2).toBeGreaterThanOrEqual(0)
      expect(result2).toBeLessThan(24)
    })
  })

  describe('getHourLabel', () => {
    it('should format midnight correctly', () => {
      expect(getHourLabel(0)).toBe('12am')
    })

    it('should format noon correctly', () => {
      expect(getHourLabel(12)).toBe('12pm')
    })

    it('should format morning hours correctly', () => {
      expect(getHourLabel(1)).toBe('1am')
      expect(getHourLabel(5)).toBe('5am')
      expect(getHourLabel(11)).toBe('11am')
    })

    it('should format afternoon/evening hours correctly', () => {
      expect(getHourLabel(13)).toBe('1pm')
      expect(getHourLabel(17)).toBe('5pm')
      expect(getHourLabel(23)).toBe('11pm')
    })

    it('should handle all 24 hours', () => {
      const expectedLabels = [
        '12am',
        '1am',
        '2am',
        '3am',
        '4am',
        '5am',
        '6am',
        '7am',
        '8am',
        '9am',
        '10am',
        '11am',
        '12pm',
        '1pm',
        '2pm',
        '3pm',
        '4pm',
        '5pm',
        '6pm',
        '7pm',
        '8pm',
        '9pm',
        '10pm',
        '11pm',
      ]

      for (let hour = 0; hour < 24; hour++) {
        expect(getHourLabel(hour)).toBe(expectedLabels[hour])
      }
    })

    it('should handle hours beyond 24', () => {
      expect(getHourLabel(24)).toBe('12am') // 24 wraps to 0 (midnight)
      expect(getHourLabel(25)).toBe('1am') // 25 wraps to 1
      expect(getHourLabel(36)).toBe('12pm') // 36 wraps to 12 (noon)
    })

    it('should handle negative hours', () => {
      // Negative numbers should wrap around properly
      expect(getHourLabel(-1)).toBe('11pm') // -1 wraps to 23
      expect(getHourLabel(-12)).toBe('12pm') // -12 wraps to 12
      expect(getHourLabel(-24)).toBe('12am') // -24 wraps to 0
    })

    it('should have consistent spacing', () => {
      // All labels should have no space between number and period
      for (let hour = 0; hour < 24; hour++) {
        const label = getHourLabel(hour)
        expect(label).toMatch(/^\d{1,2}(am|pm)$/)
      }
    })
  })

  describe('getHourIntervalLabel', () => {
    it('should format midnight interval correctly', () => {
      expect(getHourIntervalLabel(0)).toBe('12am-1am')
    })

    it('should format noon interval correctly', () => {
      expect(getHourIntervalLabel(12)).toBe('12pm-1pm')
    })

    it('should format morning hour intervals correctly', () => {
      expect(getHourIntervalLabel(1)).toBe('1am-2am')
      expect(getHourIntervalLabel(5)).toBe('5am-6am')
      expect(getHourIntervalLabel(11)).toBe('11am-12pm')
    })

    it('should format afternoon/evening hour intervals correctly', () => {
      expect(getHourIntervalLabel(13)).toBe('1pm-2pm')
      expect(getHourIntervalLabel(17)).toBe('5pm-6pm')
      expect(getHourIntervalLabel(23)).toBe('11pm-12am')
    })

    it('should handle transition from AM to PM correctly', () => {
      expect(getHourIntervalLabel(11)).toBe('11am-12pm')
    })

    it('should handle transition from PM to AM correctly', () => {
      expect(getHourIntervalLabel(23)).toBe('11pm-12am')
    })

    it('should handle all 24 hours', () => {
      const expectedLabels = [
        '12am-1am',
        '1am-2am',
        '2am-3am',
        '3am-4am',
        '4am-5am',
        '5am-6am',
        '6am-7am',
        '7am-8am',
        '8am-9am',
        '9am-10am',
        '10am-11am',
        '11am-12pm',
        '12pm-1pm',
        '1pm-2pm',
        '2pm-3pm',
        '3pm-4pm',
        '4pm-5pm',
        '5pm-6pm',
        '6pm-7pm',
        '7pm-8pm',
        '8pm-9pm',
        '9pm-10pm',
        '10pm-11pm',
        '11pm-12am',
      ]

      for (let hour = 0; hour < 24; hour++) {
        expect(getHourIntervalLabel(hour)).toBe(expectedLabels[hour])
      }
    })

    it('should have consistent formatting', () => {
      // All labels should match the pattern
      for (let hour = 0; hour < 24; hour++) {
        const label = getHourIntervalLabel(hour)
        expect(label).toMatch(/^\d{1,2}(am|pm)-\d{1,2}(am|pm)$/)
      }
    })
  })

  describe('getUserTimezone', () => {
    it('should return a valid timezone string', () => {
      const timezone = getUserTimezone()
      expect(typeof timezone).toBe('string')
      expect(timezone.length).toBeGreaterThan(0)
      // Should contain a forward slash (e.g., 'America/New_York', 'Europe/London')
      // or be a valid timezone abbreviation (e.g., 'UTC')
      expect(
        timezone.includes('/') || timezone === 'UTC' || timezone.length >= 3,
      ).toBe(true)
    })

    it('should return the same timezone on multiple calls', () => {
      const timezone1 = getUserTimezone()
      const timezone2 = getUserTimezone()
      expect(timezone1).toBe(timezone2)
    })
  })

  describe('integration tests', () => {
    it('should maintain consistency between conversions', () => {
      // For any local hour, converting to UTC and back should preserve the label
      for (let localHour = 0; localHour < 24; localHour++) {
        const originalLabel = getHourLabel(localHour)
        const utcHour = localToUtc(localHour)
        const backToLocal = utcToLocal(utcHour)
        const finalLabel = getHourLabel(backToLocal)

        // Labels should match (considering potential date boundary issues)
        const possibleLabels = [
          originalLabel,
          getHourLabel((localHour + 24) % 24),
          getHourLabel((localHour - 24 + 48) % 24),
        ]
        expect(possibleLabels).toContain(finalLabel)
      }
    })

    it('should handle DST transitions gracefully', () => {
      // Mock Date during DST transition
      const mockDateDST = class extends originalDate {
        getTimezoneOffset() {
          return -240 // EDT (UTC-4)
        }
      }
      global.Date = mockDateDST as unknown as DateConstructor

      // Should still produce valid hours
      const utcResult = localToUtc(2)
      expect(utcResult).toBeGreaterThanOrEqual(0)
      expect(utcResult).toBeLessThan(24)

      const localResult = utcToLocal(6)
      expect(localResult).toBeGreaterThanOrEqual(0)
      expect(localResult).toBeLessThan(24)

      // Restore original Date
      global.Date = originalDate
    })
  })
})
