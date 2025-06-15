import type { Alert } from '@everynews/schema'

export type Curator = (alert: Alert) => Promise<string[]>
