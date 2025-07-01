import { beforeEach, describe, expect, it, mock } from 'bun:test'
import type { Context } from 'hono'
import { authMiddleware } from './auth'

// Mock functions
const mockGetSession = mock(() => Promise.resolve(null))
const mockTrack = mock(() => Promise.resolve())

// Mock modules
mock.module('@everynews/auth', () => ({
  auth: {
    api: {
      getSession: mockGetSession,
    },
  },
}))

mock.module('@everynews/logs', () => ({
  track: mockTrack,
}))

// Type for our minimal mock context
type MockContext = Pick<Context, 'req' | 'set'>

// Helper function to create a mock context with only the properties we need
function createMockContext(
  method = 'GET',
  path = '/api/test',
  headers: Record<string, string> = {
    authorization: 'Bearer token123',
    'user-agent': 'Mozilla/5.0',
  },
): MockContext {
  const mockRequest = new Request(`http://localhost${path}`, {
    headers,
    method,
  })

  return {
    req: {
      header: mock((name: string) => {
        return mockRequest.headers.get(name)
      }),
      method,
      path,
      raw: mockRequest,
    },
    set: mock(),
  }
}

describe('authMiddleware', () => {
  let mockContext: MockContext
  let mockNext: typeof mock

  beforeEach(() => {
    mockGetSession.mockClear()
    mockTrack.mockClear()

    mockNext = mock(() => Promise.resolve())
    mockContext = createMockContext()
  })

  describe('successful authentication', () => {
    it('should set user and session when authenticated', async () => {
      const mockSession = {
        session: {
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          id: 'session123',
        },
        user: {
          email: 'test@example.com',
          id: 'user123',
          name: 'Test User',
        },
      }

      mockGetSession.mockResolvedValue(mockSession)

      await authMiddleware(mockContext, mockNext)

      expect(mockGetSession).toHaveBeenCalledWith({
        headers: mockContext.req.raw.headers,
      })
      expect(mockContext.set).toHaveBeenCalledWith('user', mockSession.user)
      expect(mockContext.set).toHaveBeenCalledWith(
        'session',
        mockSession.session,
      )
      expect(mockNext).toHaveBeenCalled()
      expect(mockTrack).not.toHaveBeenCalled()
    })

    it('should handle different user data structures', async () => {
      const mockSession = {
        session: {
          expiresAt: new Date(),
          id: 'session456',
          ipAddress: '192.168.1.1',
        },
        user: {
          createdAt: new Date(),
          email: 'another@example.com',
          id: 'user456',
          name: 'Another User',
          role: 'admin',
        },
      }

      mockGetSession.mockResolvedValue(mockSession)

      await authMiddleware(mockContext, mockNext)

      expect(mockContext.set).toHaveBeenCalledWith('user', mockSession.user)
      expect(mockContext.set).toHaveBeenCalledWith(
        'session',
        mockSession.session,
      )
    })
  })

  describe('unauthenticated requests', () => {
    it('should handle missing session gracefully', async () => {
      mockGetSession.mockResolvedValue(null)

      await authMiddleware(mockContext, mockNext)

      expect(mockContext.set).toHaveBeenCalledWith('user', null)
      expect(mockContext.set).toHaveBeenCalledWith('session', null)
      expect(mockNext).toHaveBeenCalled()
      expect(mockTrack).toHaveBeenCalledWith({
        channel: 'auth',
        description: 'GET /api/test',
        event: 'Unauthenticated Request',
        icon: '🔒',
        tags: {
          method: 'GET',
          path: '/api/test',
          type: 'error',
          user_agent: 'Mozilla/5.0',
        },
      })
    })

    it('should handle missing user-agent header', async () => {
      mockGetSession.mockResolvedValue(null)
      mockContext = createMockContext('GET', '/api/test', {
        authorization: 'Bearer token123',
      })

      await authMiddleware(mockContext, mockNext)

      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: expect.objectContaining({
            user_agent: 'unknown',
          }),
        }),
      )
    })

    it('should track different HTTP methods', async () => {
      mockGetSession.mockResolvedValue(null)

      const methods = ['POST', 'PUT', 'DELETE', 'PATCH']

      for (const method of methods) {
        mockTrack.mockClear()
        mockContext = createMockContext(method)

        await authMiddleware(mockContext, mockNext)

        expect(mockTrack).toHaveBeenCalledWith(
          expect.objectContaining({
            description: `${method} /api/test`,
            tags: expect.objectContaining({
              method,
            }),
          }),
        )
      }
    })
  })

  describe('error handling', () => {
    it('should handle auth.api.getSession errors', async () => {
      const error = new Error('Session validation failed')
      mockGetSession.mockRejectedValue(error)

      await expect(authMiddleware(mockContext, mockNext)).rejects.toThrow(
        'Session validation failed',
      )

      expect(mockTrack).toHaveBeenCalledWith({
        channel: 'auth',
        description: 'Auth middleware failed: Error: Session validation failed',
        event: 'Auth Middleware Error',
        icon: '❌',
        tags: {
          error: 'Error: Session validation failed',
          method: 'GET',
          path: '/api/test',
          type: 'error',
        },
      })
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should handle network errors', async () => {
      const error = new Error('Network request failed')
      mockGetSession.mockRejectedValue(error)

      await expect(authMiddleware(mockContext, mockNext)).rejects.toThrow(
        'Network request failed',
      )

      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'Auth Middleware Error',
          tags: expect.objectContaining({
            error: 'Error: Network request failed',
          }),
        }),
      )
    })

    it('should not set context values on error', async () => {
      mockGetSession.mockRejectedValue(new Error('Auth error'))

      try {
        await authMiddleware(mockContext, mockNext)
      } catch {
        // Expected to throw
      }

      expect(mockContext.set).not.toHaveBeenCalled()
    })
  })

  describe('edge cases', () => {
    it('should handle missing headers', async () => {
      // Create a mock request without headers
      const mockRequest = new Request('http://localhost/api/test', {
        method: 'GET',
      })

      // Delete headers to simulate undefined
      Object.defineProperty(mockRequest, 'headers', {
        value: undefined,
        writable: true,
      })

      mockContext = {
        req: {
          header: mock(() => null),
          method: 'GET',
          path: '/api/test',
          raw: mockRequest,
        },
        set: mock(),
      }

      mockGetSession.mockResolvedValue(null)

      await authMiddleware(mockContext, mockNext)

      expect(mockGetSession).toHaveBeenCalledWith({
        headers: undefined,
      })
    })

    it('should handle malformed session response', async () => {
      const malformedSession = {
        session: undefined,
        user: null,
      }
      mockGetSession.mockResolvedValue(malformedSession)

      await authMiddleware(mockContext, mockNext)

      expect(mockContext.set).toHaveBeenCalledWith('user', null)
      expect(mockContext.set).toHaveBeenCalledWith('session', undefined)
    })
  })
})
