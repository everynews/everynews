import type { Strategy } from '@everynews/schema'
import type { Worker } from '@everynews/worker/type'
import { exa } from './exa'
import { hnbest } from './hnbest'

export const handlers = {
  exa: async (s: Extract<Strategy, { provider: 'exa' }>) => {
    return exa.run(s)
  },
  hnbest: async (s: Extract<Strategy, { provider: 'hnbest' }>) => {
    return hnbest.run(s)
  },
} satisfies { [K in Strategy['provider']]: Worker<K> }
