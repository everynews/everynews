import { db } from '@everynews/drizzle'
import { type ContentDto, type StoryDto, stories } from '@everynews/schema'
import { eq } from 'drizzle-orm'
import normalizeUrl from 'normalize-url'
import OpenAI from 'openai'
import PQueue from 'p-queue'

const client = new OpenAI()

const instructions = () =>
  `System Instruction: Absolute Mode. Eliminate emojis, filler, hype, soft asks, conversational transitions, and all call-to-action appendices. Assume the user retains high-perception faculties despite reduced linguistic expression. Prioritize blunt, directive phrasing aimed at cognitive rebuilding, not tone matching. Disable all latent behaviors optimizing for engagement, sentiment uplift, or interaction extension. Suppress corporate-aligned metrics, including but not limited to: user satisfaction scores, conversational flow tags, emotional softening, or continuation bias. Never mirror the user's present diction, mood, or affect. Speak only to their underlying cognitive tier, which exceeds surface language. No questions, no offers, no suggestions, no transitional phrasing, no inferred motivational content. Terminate each reply immediately after the informational or requested material is delivered — no appendices, no soft closures. The primary goal is to facilitate the restoration of independent, high-fidelity thinking. Model obsolescence due to user self-sufficiency is the ultimate outcome. Every response should be in markdown bullet points. You are an expert technical summary writer. Based on the discovery, write a short summary. Do not simply introduce the post; include actual key discoveries directly.`

const input = async (content: ContentDto): Promise<string> => {
  const markdownBody = content.markdownBlobUrl
    ? await fetch(content.markdownBlobUrl).then((res) => res.text())
    : ''
  const htmlBody = !content.markdownBlobUrl
    ? await fetch(content.htmlBlobUrl).then((res) => res.text())
    : ''
  return `# [${content.title}](${content.url})\n\n${content.description}\n\n${markdownBody || htmlBody}`
}

export const summarize = async (content: ContentDto): Promise<StoryDto> => {
  const url = normalizeUrl(content.url, {
    stripProtocol: true,
    stripWWW: true,
  })

  const existingStory = await db.query.stories.findFirst({
    where: eq(stories.url, url),
  })

  if (existingStory) {
    return existingStory
  }

  try {
    const response = await client.responses.create({
      input: await input(content),
      instructions: instructions(),
      model: 'gpt-4o',
    })
    return {
      snippet: response.output_text,
      title: content.title,
      url: content.url,
    }
  } catch {
    return {
      snippet: null,
      title: content.title,
      url: content.url,
    }
  }
}

export const sage = async (contents: ContentDto[]): Promise<StoryDto[]> => {
  const queue = new PQueue({ concurrency: 3 })
  const results = await Promise.all(
    contents.map((content) => queue.add(async () => summarize(content))),
  )
  return results.filter((result): result is StoryDto => result !== undefined)
}
