import { type ContentDto, StoryDtoSchema } from '@everynews/schema'

export const summarize = async (content: ContentDto) => {
  return StoryDtoSchema.parse({
    snippet: '',
    title: content.title,
    url: content.url, // TODO: Summarize
  })
}
