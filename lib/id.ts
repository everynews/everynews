import { customAlphabet } from 'nanoid'

const CROCKFORD_BASE32_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

export const nanoid = customAlphabet(CROCKFORD_BASE32_ALPHABET, 12)
