import type { Alert, StoryMetadata } from '@everynews/schema'

export interface CuratorResult {
  url: string
  metadata?: StoryMetadata
}

export type Curator = (alert: Alert) => Promise<CuratorResult[]>
