import type { Strategy } from '@everynews/schema'

export type Worker<K extends Strategy['provider']> = (
  s: Extract<Strategy, { provider: K }>,
) => Promise<unknown>
