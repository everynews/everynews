import type { Strategy } from '@everynews/schema'
import { handlers } from './handlers'

export const runStrategy = async (s: Strategy) =>
  handlers[s.provider](s as never)
