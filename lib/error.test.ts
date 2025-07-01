import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  mock,
} from 'bun:test'
import { redactError, toastNetworkError } from './error'

// Mock sonner
const mockToastError = mock(() => {})
mock.module('sonner', () => ({
  toast: {
    error: mockToastError,
  },
}))

describe('error', () => {
  let originalNodeEnv: string | undefined

  beforeAll(() => {
    originalNodeEnv = process.env.NODE_ENV
  })

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv
  })

  beforeEach(() => {
    mockToastError.mockClear()
  })

  describe('redactError', () => {
    describe('in production environment', () => {
      beforeEach(() => {
        process.env.NODE_ENV = 'production'
      })

      it('should return new error with safe alternate string', () => {
        const originalError = new Error(
          'Sensitive database connection failed: password123',
        )
        const result = redactError({
          error: originalError,
          safeAlternateString: 'Database connection failed',
        })

        expect(result).toBeInstanceOf(Error)
        expect(result.message).toBe('Database connection failed')
        expect(result).not.toBe(originalError)
      })

      it('should handle errors with stack traces', () => {
        const originalError = new Error('API key exposed: sk_live_123456')
        originalError.stack =
          'Error: API key exposed\n    at someFunction (/path/to/file.js:10:5)'

        const result = redactError({
          error: originalError,
          safeAlternateString: 'API error occurred',
        })

        expect(result.message).toBe('API error occurred')
        expect(result.stack).not.toContain('sk_live_123456')
      })

      it('should handle empty safe alternate string', () => {
        const originalError = new Error('Sensitive error')
        const result = redactError({
          error: originalError,
          safeAlternateString: '',
        })

        expect(result.message).toBe('')
      })

      it('should handle errors with custom properties', () => {
        interface CustomError extends Error {
          code?: string
          details?: { password: string }
        }
        const originalError = new Error('Sensitive error') as CustomError
        originalError.code = 'DB_AUTH_FAILED'
        originalError.details = { password: 'secret123' }

        const result = redactError({
          error: originalError,
          safeAlternateString: 'Generic error',
        })

        expect(result.message).toBe('Generic error')
        expect((result as CustomError).code).toBeUndefined()
        expect((result as CustomError).details).toBeUndefined()
      })
    })

    describe('in non-production environment', () => {
      beforeEach(() => {
        process.env.NODE_ENV = 'development'
      })

      it('should return original error', () => {
        const originalError = new Error(
          'Detailed error message with sensitive info',
        )
        const result = redactError({
          error: originalError,
          safeAlternateString: 'Generic error',
        })

        expect(result).toBe(originalError)
        expect(result.message).toBe(
          'Detailed error message with sensitive info',
        )
      })

      it('should preserve error properties in development', () => {
        interface DevError extends Error {
          code?: string
          customProp?: string
        }
        const originalError = new Error('Dev error') as DevError
        originalError.code = 'DETAILED_ERROR_CODE'
        originalError.stack = 'Detailed stack trace'
        originalError.customProp = 'custom value'

        const result = redactError({
          error: originalError,
          safeAlternateString: 'Generic error',
        })

        expect(result).toBe(originalError)
        expect((result as DevError).code).toBe('DETAILED_ERROR_CODE')
        expect(result.stack).toBe('Detailed stack trace')
        expect((result as DevError).customProp).toBe('custom value')
      })
    })

    describe('with different NODE_ENV values', () => {
      it('should treat undefined NODE_ENV as non-production', () => {
        delete process.env.NODE_ENV

        const originalError = new Error('Error message')
        const result = redactError({
          error: originalError,
          safeAlternateString: 'Safe message',
        })

        expect(result).toBe(originalError)
      })

      it('should treat "test" as non-production', () => {
        process.env.NODE_ENV = 'test'

        const originalError = new Error('Test error')
        const result = redactError({
          error: originalError,
          safeAlternateString: 'Safe message',
        })

        expect(result).toBe(originalError)
      })

      it('should treat "staging" as non-production', () => {
        process.env.NODE_ENV = 'staging'

        const originalError = new Error('Staging error')
        const result = redactError({
          error: originalError,
          safeAlternateString: 'Safe message',
        })

        expect(result).toBe(originalError)
      })

      it('should only redact in exactly "production" environment', () => {
        process.env.NODE_ENV = 'PRODUCTION' // uppercase

        const originalError = new Error('Error')
        const result = redactError({
          error: originalError,
          safeAlternateString: 'Safe',
        })

        expect(result).toBe(originalError) // Not redacted because it's not exactly "production"
      })
    })

    describe('edge cases', () => {
      it('should handle null-like errors gracefully', () => {
        process.env.NODE_ENV = 'production'

        const nullError = { message: null } as { message: null }
        const result = redactError({
          error: nullError,
          safeAlternateString: 'Safe error',
        })

        expect(result.message).toBe('Safe error')
      })

      it('should handle very long safe alternate strings', () => {
        process.env.NODE_ENV = 'production'

        const originalError = new Error('Short')
        const longString = 'A'.repeat(10000)
        const result = redactError({
          error: originalError,
          safeAlternateString: longString,
        })

        expect(result.message).toBe(longString)
        expect(result.message).toHaveLength(10000)
      })

      it('should handle special characters in safe alternate string', () => {
        process.env.NODE_ENV = 'production'

        const originalError = new Error('Original')
        const specialString = 'Error: \n\t\r\0 unicode: 你好 emoji: 🚨'
        const result = redactError({
          error: originalError,
          safeAlternateString: specialString,
        })

        expect(result.message).toBe(specialString)
      })
    })
  })

  describe('toastNetworkError', () => {
    describe('in production environment', () => {
      beforeEach(() => {
        process.env.NODE_ENV = 'production'
      })

      it('should toast redacted network error message', () => {
        const error = new Error(
          'Failed to fetch: ECONNREFUSED 192.168.1.1:5432',
        )
        toastNetworkError(error)

        expect(mockToastError).toHaveBeenCalledTimes(1)
        expect(mockToastError).toHaveBeenCalledWith('Network Error')
      })

      it('should always show "Network Error" in production', () => {
        const errors = [
          new Error('Connection timeout after 30000ms'),
          new Error('DNS lookup failed for secret-server.internal'),
          new Error('SSL certificate verification failed'),
          new Error('Proxy authentication required: user@proxy.corp'),
        ]

        errors.forEach((error) => {
          mockToastError.mockClear()
          toastNetworkError(error)
          expect(mockToastError).toHaveBeenCalledWith('Network Error')
        })
      })
    })

    describe('in non-production environment', () => {
      beforeEach(() => {
        process.env.NODE_ENV = 'development'
      })

      it('should toast original error message', () => {
        const error = new Error(
          'Failed to connect to database at localhost:5432',
        )
        toastNetworkError(error)

        expect(mockToastError).toHaveBeenCalledTimes(1)
        expect(mockToastError).toHaveBeenCalledWith(
          'Failed to connect to database at localhost:5432',
        )
      })

      it('should preserve detailed error information in development', () => {
        const errors = [
          new Error('CORS error: No Access-Control-Allow-Origin header'),
          new Error('401 Unauthorized: Invalid API key'),
          new Error('Network timeout: Request took 45.2 seconds'),
          new Error('WebSocket connection failed on port 8080'),
        ]

        errors.forEach((error) => {
          mockToastError.mockClear()
          toastNetworkError(error)
          expect(mockToastError).toHaveBeenCalledWith(error.message)
        })
      })
    })

    describe('error handling', () => {
      it('should handle errors without messages', () => {
        process.env.NODE_ENV = 'production'

        const error = new Error()
        toastNetworkError(error)

        expect(mockToastError).toHaveBeenCalledWith('Network Error')
      })

      it('should handle custom error classes', () => {
        process.env.NODE_ENV = 'development'

        class NetworkError extends Error {
          constructor(message: string) {
            super(message)
            this.name = 'NetworkError'
          }
        }

        const error = new NetworkError('Custom network error')
        toastNetworkError(error)

        expect(mockToastError).toHaveBeenCalledWith('Custom network error')
      })

      it('should be called multiple times independently', () => {
        process.env.NODE_ENV = 'production'

        const error1 = new Error('Error 1')
        const error2 = new Error('Error 2')
        const error3 = new Error('Error 3')

        toastNetworkError(error1)
        toastNetworkError(error2)
        toastNetworkError(error3)

        expect(mockToastError).toHaveBeenCalledTimes(3)
        expect(mockToastError).toHaveBeenCalledWith('Network Error')
      })
    })
  })

  describe('integration', () => {
    it('should work correctly when switching environments', () => {
      const error = new Error('Sensitive: API_KEY=abc123')

      // First in development
      process.env.NODE_ENV = 'development'
      toastNetworkError(error)
      expect(mockToastError).toHaveBeenLastCalledWith(
        'Sensitive: API_KEY=abc123',
      )

      // Then in production
      process.env.NODE_ENV = 'production'
      toastNetworkError(error)
      expect(mockToastError).toHaveBeenLastCalledWith('Network Error')

      // Back to development
      process.env.NODE_ENV = 'development'
      toastNetworkError(error)
      expect(mockToastError).toHaveBeenLastCalledWith(
        'Sensitive: API_KEY=abc123',
      )
    })
  })
})
