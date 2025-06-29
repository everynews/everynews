import { beforeAll, describe, expect, it } from 'bun:test'
import { decrypt, encrypt, generateEncryptionKey } from './crypto'

describe('crypto', () => {
  beforeAll(() => {
    // Set a test encryption key
    process.env.ENCRYPTION_KEY = generateEncryptionKey()
  })

  describe('generateEncryptionKey', () => {
    it('should generate a 64-character hex string', () => {
      const key = generateEncryptionKey()
      expect(key).toHaveLength(64)
      expect(/^[0-9a-f]{64}$/i.test(key)).toBe(true)
    })
  })

  describe('encrypt and decrypt', () => {
    it('should encrypt and decrypt a string correctly', async () => {
      const originalText = 'xoxb-1234567890-abcdefghijk'
      const encrypted = await encrypt(originalText)
      const decrypted = await decrypt(encrypted)

      expect(decrypted).toBe(originalText)
    })

    it('should produce different encrypted values for the same input', async () => {
      const originalText = 'test-token-123'
      const encrypted1 = await encrypt(originalText)
      const encrypted2 = await encrypt(originalText)

      expect(encrypted1).not.toBe(encrypted2)
    })

    it('should handle empty strings', async () => {
      const originalText = ''
      const encrypted = await encrypt(originalText)
      const decrypted = await decrypt(encrypted)

      expect(decrypted).toBe(originalText)
    })

    it('should handle long strings', async () => {
      const originalText = 'a'.repeat(1000)
      const encrypted = await encrypt(originalText)
      const decrypted = await decrypt(encrypted)

      expect(decrypted).toBe(originalText)
    })

    it('should handle special characters and unicode', async () => {
      const originalText = '🔐 Special chars: !@#$%^&*() 中文 العربية'
      const encrypted = await encrypt(originalText)
      const decrypted = await decrypt(encrypted)

      expect(decrypted).toBe(originalText)
    })

    it('should throw error for too short encrypted data', async () => {
      // Valid base64 but too short to contain all required components
      expect(decrypt('dGVzdA==')).rejects.toThrow(
        'Invalid encrypted data: insufficient length',
      )
    })

    it('should throw error for corrupted encrypted data', async () => {
      const originalText = 'test'
      const encrypted = await encrypt(originalText)
      // Corrupt the encrypted data by removing some characters
      const corrupted = encrypted.slice(0, -10)

      expect(decrypt(corrupted)).rejects.toThrow(
        'Invalid encrypted data: insufficient length',
      )
    })

    it('should throw error for tampered encrypted data', async () => {
      const originalText = 'test'
      const encrypted = await encrypt(originalText)
      // Tamper with the encrypted data
      const tampered = `${encrypted.slice(0, -5)}xxxxx`

      expect(decrypt(tampered)).rejects.toThrow(
        'Decryption failed: invalid data or authentication tag',
      )
    })
  })

  describe('Environment key validation', () => {
    it('should throw error when ENCRYPTION_KEY is not set', () => {
      const originalKey = process.env.ENCRYPTION_KEY
      delete process.env.ENCRYPTION_KEY

      expect(() => encrypt('test')).toThrow(
        'ENCRYPTION_KEY environment variable is not set',
      )

      process.env.ENCRYPTION_KEY = originalKey
    })

    it('should throw error when ENCRYPTION_KEY is not hex', () => {
      const originalKey = process.env.ENCRYPTION_KEY
      process.env.ENCRYPTION_KEY = 'not-a-hex-string-zzz'

      expect(() => encrypt('test')).toThrow(
        'ENCRYPTION_KEY must be a valid hexadecimal string',
      )

      process.env.ENCRYPTION_KEY = originalKey
    })

    it('should throw error when ENCRYPTION_KEY is wrong length', () => {
      const originalKey = process.env.ENCRYPTION_KEY
      process.env.ENCRYPTION_KEY = 'abcdef' // Too short

      expect(() => encrypt('test')).toThrow(
        'ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes)',
      )

      process.env.ENCRYPTION_KEY = originalKey
    })
  })
})
