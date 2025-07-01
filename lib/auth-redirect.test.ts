import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { redirectToSignIn } from './auth-redirect'

// Mock next/navigation
const mockRedirect = mock(() => {})
mock.module('next/navigation', () => ({
  redirect: mockRedirect,
}))

describe('redirectToSignIn', () => {
  // Clear mock calls before each test
  beforeEach(() => {
    mockRedirect.mockClear()
  })

  describe('without callback path', () => {
    it('should redirect to /sign-in when no callback path is provided', () => {
      redirectToSignIn()

      expect(mockRedirect).toHaveBeenCalledTimes(1)
      expect(mockRedirect).toHaveBeenCalledWith('/sign-in')
    })

    it('should redirect to /sign-in when callback path is undefined', () => {
      redirectToSignIn(undefined)

      expect(mockRedirect).toHaveBeenCalledTimes(1)
      expect(mockRedirect).toHaveBeenCalledWith('/sign-in')
    })

    it('should redirect to /sign-in when callback path is empty string', () => {
      redirectToSignIn('')

      expect(mockRedirect).toHaveBeenCalledTimes(1)
      expect(mockRedirect).toHaveBeenCalledWith('/sign-in')
    })
  })

  describe('with callback path', () => {
    it('should include encoded callback path in redirect URL', () => {
      redirectToSignIn('/dashboard')

      expect(mockRedirect).toHaveBeenCalledTimes(1)
      expect(mockRedirect).toHaveBeenCalledWith(
        '/sign-in?callback=%2Fdashboard',
      )
    })

    it('should properly encode callback paths with query parameters', () => {
      redirectToSignIn('/dashboard?tab=settings&user=123')

      expect(mockRedirect).toHaveBeenCalledTimes(1)
      expect(mockRedirect).toHaveBeenCalledWith(
        '/sign-in?callback=%2Fdashboard%3Ftab%3Dsettings%26user%3D123',
      )
    })

    it('should handle callback paths with special characters', () => {
      redirectToSignIn('/path/with spaces/and#hash')

      expect(mockRedirect).toHaveBeenCalledTimes(1)
      expect(mockRedirect).toHaveBeenCalledWith(
        '/sign-in?callback=%2Fpath%2Fwith%20spaces%2Fand%23hash',
      )
    })

    it('should handle callback paths with unicode characters', () => {
      redirectToSignIn('/users/김철수/profile')

      expect(mockRedirect).toHaveBeenCalledTimes(1)
      expect(mockRedirect).toHaveBeenCalledWith(
        '/sign-in?callback=%2Fusers%2F%EA%B9%80%EC%B2%A0%EC%88%98%2Fprofile',
      )
    })

    it('should handle absolute URLs as callback paths', () => {
      redirectToSignIn('https://example.com/callback')

      expect(mockRedirect).toHaveBeenCalledTimes(1)
      expect(mockRedirect).toHaveBeenCalledWith(
        '/sign-in?callback=https%3A%2F%2Fexample.com%2Fcallback',
      )
    })

    it('should handle callback paths with multiple slashes', () => {
      redirectToSignIn('//path//with///multiple////slashes')

      expect(mockRedirect).toHaveBeenCalledTimes(1)
      expect(mockRedirect).toHaveBeenCalledWith(
        '/sign-in?callback=%2F%2Fpath%2F%2Fwith%2F%2F%2Fmultiple%2F%2F%2F%2Fslashes',
      )
    })
  })

  describe('edge cases', () => {
    it('should handle very long callback paths', () => {
      const longPath = `/very/long/path/${'segment/'.repeat(100)}`
      redirectToSignIn(longPath)

      expect(mockRedirect).toHaveBeenCalledTimes(1)
      const expectedUrl = `/sign-in?callback=${encodeURIComponent(longPath)}`
      expect(mockRedirect).toHaveBeenCalledWith(expectedUrl)
    })

    it('should handle callback path with only special characters', () => {
      redirectToSignIn('?&#%/@!')

      expect(mockRedirect).toHaveBeenCalledTimes(1)
      expect(mockRedirect).toHaveBeenCalledWith(
        '/sign-in?callback=%3F%26%23%25%2F%40!',
      )
    })

    it('should handle callback path with null character', () => {
      redirectToSignIn('/path\0with\0null')

      expect(mockRedirect).toHaveBeenCalledTimes(1)
      expect(mockRedirect).toHaveBeenCalledWith(
        '/sign-in?callback=%2Fpath%00with%00null',
      )
    })

    it('should be called exactly once per invocation', () => {
      redirectToSignIn('/test')
      redirectToSignIn('/another')
      redirectToSignIn()

      expect(mockRedirect).toHaveBeenCalledTimes(3)
    })
  })

  describe('security considerations', () => {
    it('should properly encode potentially malicious callback paths', () => {
      const maliciousPath = '/"><script>alert("xss")</script>'
      redirectToSignIn(maliciousPath)

      expect(mockRedirect).toHaveBeenCalledTimes(1)
      expect(mockRedirect).toHaveBeenCalledWith(
        '/sign-in?callback=%2F%22%3E%3Cscript%3Ealert(%22xss%22)%3C%2Fscript%3E',
      )
    })

    it('should encode javascript: protocol in callback', () => {
      redirectToSignIn('javascript:alert(1)')

      expect(mockRedirect).toHaveBeenCalledTimes(1)
      expect(mockRedirect).toHaveBeenCalledWith(
        '/sign-in?callback=javascript%3Aalert(1)',
      )
    })

    it('should handle data: URLs in callback', () => {
      redirectToSignIn('data:text/html,<script>alert(1)</script>')

      expect(mockRedirect).toHaveBeenCalledTimes(1)
      expect(mockRedirect).toHaveBeenCalledWith(
        '/sign-in?callback=data%3Atext%2Fhtml%2C%3Cscript%3Ealert(1)%3C%2Fscript%3E',
      )
    })
  })
})
