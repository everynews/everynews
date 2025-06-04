import type { Newsletter } from '@everynews/schema'

export type Curator = (newsletter: Newsletter) => Promise<string[]>
