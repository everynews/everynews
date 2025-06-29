import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

const algorithm = 'aes-256-gcm'
const keyLength = 32 // 256 bits
const ivLength = 16 // 128 bits
const tagLength = 16 // 128 bits
const saltLength = 64 // 512 bits

// Get encryption key from environment
const getEncryptionKey = (): Buffer => {
  const key = process.env.ENCRYPTION_KEY
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set')
  }

  if (!/^[0-9a-fA-F]+$/.test(key)) {
    throw new Error('ENCRYPTION_KEY must be a valid hexadecimal string')
  }

  const keyBuffer = Buffer.from(key, 'hex')
  if (keyBuffer.length !== keyLength) {
    throw new Error(
      `ENCRYPTION_KEY must be exactly ${keyLength * 2} hex characters (${keyLength} bytes)`,
    )
  }

  return keyBuffer
}

export const encrypt = (text: string): string => {
  const key = getEncryptionKey()
  const iv = randomBytes(ivLength)
  const salt = randomBytes(saltLength)

  const cipher = createCipheriv(algorithm, key, iv)

  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])

  const tag = cipher.getAuthTag()

  // Combine salt, iv, tag, and encrypted data
  const combined = Buffer.concat([salt, iv, tag, encrypted])

  return combined.toString('base64')
}

export const decrypt = (encryptedText: string): string => {
  const key = getEncryptionKey()
  const combined = Buffer.from(encryptedText, 'base64')

  // Extract components
  const iv = combined.slice(saltLength, saltLength + ivLength)
  const tag = combined.slice(
    saltLength + ivLength,
    saltLength + ivLength + tagLength,
  )
  const encrypted = combined.slice(saltLength + ivLength + tagLength)

  const decipher = createDecipheriv(algorithm, key, iv)
  decipher.setAuthTag(tag)

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ])

  return decrypted.toString('utf8')
}

// Helper to generate a new encryption key
export const generateEncryptionKey = (): string => {
  return randomBytes(keyLength).toString('hex')
}
