import { beforeEach, describe, expect, it, mock } from 'bun:test'
import {
  getValidSlackToken,
  isTokenError,
  refreshSlackToken,
} from './token-refresh'

// Mock functions
const mockFindFirst = mock(() => Promise.resolve(null))
const mockUpdate = mock(() => ({
  set: mock(() => ({
    where: mock(() => Promise.resolve()),
  })),
}))
const mockEncrypt = mock((value: string) =>
  Promise.resolve(`encrypted_${value}`),
)
const mockDecrypt = mock((value: string) =>
  Promise.resolve(value.replace('encrypted_', '')),
)
const mockTrack = mock(() => Promise.resolve())
const mockRefreshAccessToken = mock(() =>
  Promise.resolve({
    accessToken: 'xoxb-new-token',
    expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
    refreshToken: 'xoxe-new-refresh-token',
  }),
)

// Mock modules
mock.module('@everynews/database', () => ({
  db: {
    query: {
      channels: {
        findFirst: mockFindFirst,
      },
    },
    update: mockUpdate,
  },
}))

mock.module('@everynews/lib/crypto', () => ({
  decrypt: mockDecrypt,
  encrypt: mockEncrypt,
}))

mock.module('@everynews/logs', () => ({
  track: mockTrack,
}))

mock.module('./oauth-installer', () => ({
  refreshAccessToken: mockRefreshAccessToken,
}))

describe('token-refresh', () => {
  beforeEach(() => {
    mockFindFirst.mockClear()
    mockUpdate.mockClear()
    mockEncrypt.mockClear()
    mockDecrypt.mockClear()
    mockTrack.mockClear()
    mockRefreshAccessToken.mockClear()
  })

  describe('refreshSlackToken', () => {
    const mockChannel = {
      config: {
        accessToken: 'encrypted_xoxb-old-token',
        channelId: 'C123456',
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
        refreshToken: 'encrypted_xoxe-refresh-token',
        teamId: 'T123456',
        tokenRotationEnabled: true,
      },
      deletedAt: null,
      id: 'channel123',
      type: 'slack',
    }

    describe('successful token refresh', () => {
      it('should refresh token when close to expiry', async () => {
        // Set token to expire in 30 minutes (less than 1 hour)
        const expiringChannel = {
          ...mockChannel,
          config: {
            ...mockChannel.config,
            expiresAt: new Date(Date.now() + 30 * 60 * 1000),
          },
        }

        mockFindFirst.mockResolvedValue(expiringChannel)
        mockRefreshAccessToken.mockResolvedValue({
          accessToken: 'xoxb-new-token',
          expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours
          refreshToken: 'xoxe-new-refresh-token',
        })

        const result = await refreshSlackToken('channel123')

        expect(result).toBe(true)
        expect(mockDecrypt).toHaveBeenCalledWith('encrypted_xoxe-refresh-token')
        expect(mockRefreshAccessToken).toHaveBeenCalledWith(
          'xoxe-refresh-token',
          'T123456',
        )
        expect(mockEncrypt).toHaveBeenCalledWith('xoxb-new-token')
        expect(mockEncrypt).toHaveBeenCalledWith('xoxe-new-refresh-token')
        expect(mockUpdate).toHaveBeenCalled()
        expect(mockTrack).toHaveBeenCalledWith(
          expect.objectContaining({
            event: 'Token Refreshed',
          }),
        )
      })

      it('should handle refresh without new refresh token', async () => {
        const expiringChannel = {
          ...mockChannel,
          config: {
            ...mockChannel.config,
            expiresAt: new Date(Date.now() + 30 * 60 * 1000),
          },
        }

        mockFindFirst.mockResolvedValue(expiringChannel)
        mockRefreshAccessToken.mockResolvedValue({
          accessToken: 'xoxb-new-token',
          expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
          refreshToken: null,
        })

        const result = await refreshSlackToken('channel123')

        expect(result).toBe(true)
        expect(mockEncrypt).toHaveBeenCalledWith('xoxb-new-token')
        expect(mockEncrypt).toHaveBeenCalledTimes(1) // Only access token encrypted
      })
    })

    describe('skip conditions', () => {
      it('should skip refresh if token rotation is disabled', async () => {
        const channelWithoutRotation = {
          ...mockChannel,
          config: {
            ...mockChannel.config,
            tokenRotationEnabled: false,
          },
        }

        mockFindFirst.mockResolvedValue(channelWithoutRotation)

        const result = await refreshSlackToken('channel123')

        expect(result).toBe(false)
        expect(mockRefreshAccessToken).not.toHaveBeenCalled()
        expect(mockTrack).toHaveBeenCalledWith(
          expect.objectContaining({
            description: 'Token rotation not enabled for channel',
            event: 'Token Refresh Skipped',
          }),
        )
      })

      it('should skip refresh if token is valid for more than 1 hour', async () => {
        const validChannel = {
          ...mockChannel,
          config: {
            ...mockChannel.config,
            expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
          },
        }

        mockFindFirst.mockResolvedValue(validChannel)

        const result = await refreshSlackToken('channel123')

        expect(result).toBe(false)
        expect(mockRefreshAccessToken).not.toHaveBeenCalled()
      })
    })

    describe('error handling', () => {
      it('should throw error if channel not found', async () => {
        mockFindFirst.mockResolvedValue(null)

        await expect(refreshSlackToken('channel123')).rejects.toThrow(
          'Channel not found',
        )
      })

      it('should handle refresh API errors', async () => {
        const expiringChannel = {
          ...mockChannel,
          config: {
            ...mockChannel.config,
            expiresAt: new Date(Date.now() + 30 * 60 * 1000),
          },
        }

        mockFindFirst.mockResolvedValue(expiringChannel)
        mockRefreshAccessToken.mockRejectedValue(
          new Error('invalid_refresh_token'),
        )

        await expect(refreshSlackToken('channel123')).rejects.toThrow(
          'invalid_refresh_token',
        )
        expect(mockTrack).toHaveBeenCalledWith(
          expect.objectContaining({
            event: 'Token Refresh Failed',
          }),
        )
      })
    })
  })

  describe('getValidSlackToken', () => {
    const mockChannel = {
      config: {
        accessToken: 'encrypted_xoxb-token',
        channelId: 'C123456',
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
        refreshToken: 'encrypted_xoxe-refresh-token',
        teamId: 'T123456',
        tokenRotationEnabled: true,
      },
      deletedAt: null,
      id: 'channel123',
      type: 'slack',
    }

    it('should return decrypted token without refresh', async () => {
      mockFindFirst.mockResolvedValue(mockChannel)

      const token = await getValidSlackToken('channel123')

      expect(token).toBe('xoxb-token')
      expect(mockDecrypt).toHaveBeenCalledWith('encrypted_xoxb-token')
      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'Token Decrypted',
        }),
      )
    })

    it('should handle channel not found', async () => {
      mockFindFirst.mockResolvedValue(null)

      await expect(getValidSlackToken('channel123')).rejects.toThrow(
        'Failed to get valid token',
      )
      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'Channel Not Found',
        }),
      )
    })

    it('should throw user-friendly error for invalid refresh token', async () => {
      // First call for refresh attempt returns channel with expiring token
      const expiringChannel = {
        ...mockChannel,
        config: {
          ...mockChannel.config,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes, triggers refresh
        },
      }

      mockFindFirst
        .mockResolvedValueOnce(expiringChannel) // First call during refresh
        .mockResolvedValueOnce(mockChannel) // Second call after refresh fails
      mockRefreshAccessToken.mockRejectedValue(
        new Error('invalid_refresh_token'),
      )

      await expect(getValidSlackToken('channel123')).rejects.toThrow(
        'Your Slack authentication has expired. Please reconnect your Slack workspace.',
      )
    })
  })

  describe('isTokenError', () => {
    it('should identify token errors by data.error', () => {
      expect(isTokenError({ data: { error: 'invalid_auth' } })).toBe(true)
      expect(isTokenError({ data: { error: 'token_revoked' } })).toBe(true)
      expect(isTokenError({ data: { error: 'token_expired' } })).toBe(true)
      expect(isTokenError({ data: { error: 'invalid_refresh_token' } })).toBe(
        true,
      )
    })

    it('should identify token errors by code', () => {
      expect(isTokenError({ code: 'invalid_auth' })).toBe(true)
      expect(isTokenError({ code: 'token_revoked' })).toBe(true)
      expect(isTokenError({ code: 'token_expired' })).toBe(true)
      expect(isTokenError({ code: 'invalid_refresh_token' })).toBe(true)
    })

    it('should return false for non-token errors', () => {
      expect(isTokenError({ data: { error: 'channel_not_found' } })).toBe(false)
      expect(isTokenError({ code: 'not_authorized' })).toBe(false)
      expect(isTokenError({ data: { error: 'rate_limited' } })).toBe(false)
      expect(isTokenError({})).toBe(false)
      expect(isTokenError(null)).toBe(false)
      expect(isTokenError(undefined)).toBe(false)
      expect(isTokenError('string error')).toBe(false)
    })
  })
})
