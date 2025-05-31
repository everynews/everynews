import type { NewsDto } from '@everynews/schema'

export interface Curator {
  run(news: NewsDto): Promise<string[]>
}
