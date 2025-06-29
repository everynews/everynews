import {
  createCipheriv,
  createDecipheriv,
  hkdf,
  randomBytes,
} from 'node:crypto'
import { promisify } from 'node:util'

const hkdfAsync = promisify(hkdf)

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

// Derive a unique encryption key using HKDF with the provided salt
const deriveKey = async (baseKey: Buffer, salt: Buffer): Promise<Buffer> => {
  const info = Buffer.from('everynews-encryption', 'utf8')
  const derivedKey = await hkdfAsync('sha256', baseKey, salt, info, keyLength)
  return Buffer.from(derivedKey)
}

export const encrypt = async (text: string): Promise<string> => {
  const baseKey = getEncryptionKey()
  const iv = randomBytes(ivLength)
  const salt = randomBytes(saltLength)

  // Derive a unique key using the salt
  const derivedKey = await deriveKey(baseKey, salt)

  const cipher = createCipheriv(algorithm, derivedKey, iv)

  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])

  const tag = cipher.getAuthTag()

  // Combine salt, iv, tag, and encrypted data
  const combined = Buffer.concat([salt, iv, tag, encrypted])

  return combined.toString('base64')
}

export const decrypt = async (encryptedText: string): Promise<string> => {
  const baseKey = getEncryptionKey()

  let combined: Buffer
  try {
    combined = Buffer.from(encryptedText, 'base64')
  } catch (_error) {
    throw new Error('Invalid base64 input for decryption')
  }

  // Validate combined buffer length
  const minLength = saltLength + ivLength + tagLength
  if (combined.length < minLength) {
    throw new Error('Invalid encrypted data: insufficient length')
  }

  // Extract components
  const salt = combined.slice(0, saltLength)
  const iv = combined.slice(saltLength, saltLength + ivLength)
  const tag = combined.slice(
    saltLength + ivLength,
    saltLength + ivLength + tagLength,
  )
  const encrypted = combined.slice(saltLength + ivLength + tagLength)

  // Derive the same key using the extracted salt
  const derivedKey = await deriveKey(baseKey, salt)

  try {
    const decipher = createDecipheriv(algorithm, derivedKey, iv)
    decipher.setAuthTag(tag)

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ])

    return decrypted.toString('utf8')
  } catch (_error) {
    throw new Error('Decryption failed: invalid data or authentication tag')
  }
}

// Helper to generate a new encryption key
export const generateEncryptionKey = (): string => {
  return randomBytes(keyLength).toString('hex')
}
