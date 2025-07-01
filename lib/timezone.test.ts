import { beforeAll, describe, expect, it } from 'bun:test'
import { getHourLabel, localToUtc, utcToLocal } from './timezone'

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
      expect(getHourLabel(0)).toBe('12 AM')
    })

    it('should format noon correctly', () => {
      expect(getHourLabel(12)).toBe('12 PM')
    })

    it('should format morning hours correctly', () => {
      expect(getHourLabel(1)).toBe('1 AM')
      expect(getHourLabel(5)).toBe('5 AM')
      expect(getHourLabel(11)).toBe('11 AM')
    })

    it('should format afternoon/evening hours correctly', () => {
      expect(getHourLabel(13)).toBe('1 PM')
      expect(getHourLabel(17)).toBe('5 PM')
      expect(getHourLabel(23)).toBe('11 PM')
    })

    it('should handle all 24 hours', () => {
      const expectedLabels = [
        '12 AM',
        '1 AM',
        '2 AM',
        '3 AM',
        '4 AM',
        '5 AM',
        '6 AM',
        '7 AM',
        '8 AM',
        '9 AM',
        '10 AM',
        '11 AM',
        '12 PM',
        '1 PM',
        '2 PM',
        '3 PM',
        '4 PM',
        '5 PM',
        '6 PM',
        '7 PM',
        '8 PM',
        '9 PM',
        '10 PM',
        '11 PM',
      ]

      for (let hour = 0; hour < 24; hour++) {
        expect(getHourLabel(hour)).toBe(expectedLabels[hour])
      }
    })

    it('should handle hours beyond 24', () => {
      expect(getHourLabel(24)).toBe('12 PM') // 24 % 12 = 0, but 24 >= 12 so PM
      expect(getHourLabel(25)).toBe('1 PM') // 25 % 12 = 1, and 25 >= 12 so PM
      expect(getHourLabel(36)).toBe('12 PM') // 36 % 12 = 0, and 36 >= 12 so PM
    })

    it('should handle negative hours', () => {
      // Negative numbers aren't handled as wraparound in the function
      expect(getHourLabel(-1)).toBe('-1 AM') // -1 < 12 so AM
      expect(getHourLabel(-12)).toBe('12 AM') // -12 % 12 = 0, -12 < 12 so AM
      expect(getHourLabel(-24)).toBe('12 AM') // -24 % 12 = 0, -24 < 12 so AM
    })

    it('should have consistent spacing', () => {
      // All labels should have exactly one space between number and period
      for (let hour = 0; hour < 24; hour++) {
        const label = getHourLabel(hour)
        expect(label).toMatch(/^\d{1,2} (AM|PM)$/)
        expect(label.split(' ')).toHaveLength(2)
      }
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
        constructor(...args: any[]) {
          super(...args)
          if (args.length === 0) {
            // Set date during DST transition
            this.setFullYear(2024, 2, 10) // March 10, 2024
            this.setHours(2, 0, 0, 0)
          }
        }
        getTimezoneOffset() {
          return -240 // EDT (UTC-4)
        }
      } as any
      global.Date = mockDateDST

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
