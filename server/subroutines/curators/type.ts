import type { NewsDto } from '@everynews/schema'

export type Curator = (news: NewsDto) => Promise<string[]>
