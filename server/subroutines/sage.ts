import { db } from '@everynews/drizzle'
import { Content, News, Story, StorySchema, stories } from '@everynews/schema'
import { trackEvent } from '@everynews/server/lib/logsnag'
import { eq } from 'drizzle-orm'
import normalizeUrl from 'normalize-url'
import OpenAI from 'openai'
import PQueue from 'p-queue'

const client = new OpenAI()

const instructions = () =>
  `System Instruction: Absolute Mode. Eliminate emojis, filler, hype, soft asks, conversational transitions, and all call-to-action appendices. Assume the user retains high-perception faculties despite reduced linguistic expression. Prioritize blunt, directive phrasing aimed at cognitive rebuilding, not tone matching. Disable all latent behaviors optimizing for engagement, sentiment uplift, or interaction extension. Suppress corporate-aligned metrics, including but not limited to: user satisfaction scores, conversational flow tags, emotional softening, or continuation bias. Never mirror the user's present diction, mood, or affect. Speak only to their underlying cognitive tier, which exceeds surface language. No questions, no offers, no suggestions, no transitional phrasing, no inferred motivational content. Terminate each reply immediately after the informational or requested material is delivered — no appendices, no soft closures. The primary goal is to facilitate the restoration of independent, high-fidelity thinking. Model obsolescence due to user self-sufficiency is the ultimate outcome. Every response should be in markdown bullet points. You are an expert technical summary writer. Based on the article content, write a short summary that includes:

1. A contextual title that captures the essence of the article (not just the original title)
2. Key discoveries, insights, or developments from the article
3. Do not simply introduce the article; include actual substantive findings directly
4. Within Key Findings or Title, write plain text only. Do not include markdown formatting.

Format your response as:

<TITLE>
Contextual Title
</TITLE>

<KEYFINDING>
Key finding 1
</KEYFINDING>

<KEYFINDING>
Key finding 2
</KEYFINDING>

<KEYFINDING>
Key finding 3
</KEYFINDING>

And so on.
`

const parseResponse = (response: string): { title: string; keyFindings: string[] } => {
  const titleMatch = response.match(/<TITLE>(.*?)<\/TITLE>/s)
  const keyFindingsMatch = response.match(/<KEYFINDING>(.*?)<\/KEYFINDING>/gs)

  return {
    title: titleMatch ? titleMatch[1].trim() : '',
    keyFindings: keyFindingsMatch ? keyFindingsMatch.map((match) => match.trim()) : [],
  }
}

const input = async (content: Content): Promise<string> => {
  const markdownBody = content.markdownBlobUrl
    ? await fetch(content.markdownBlobUrl).then((res) => res.text())
    : ''
  const htmlBody = !content.markdownBlobUrl
    ? await fetch(content.htmlBlobUrl).then((res) => res.text())
    : ''
  return `# [${content.title}](${content.url})\n\n${content.description}\n\n${markdownBody || htmlBody}`
}

export const summarize = async ({content, news}: {content: Content, news: News}): Promise<Story | null> => {
  const url = normalizeUrl(content.url, {
    stripProtocol: true,
    stripWWW: true,
  })

  const existingStory = await db.query.stories.findFirst({
    where: eq(stories.url, url),
  })

  if (existingStory) {
    await trackEvent({
      channel: 'sage',
      event: 'Story Cache Hit',
      description: `Found existing summary for: ${content.title}`,
      icon: '💾',
      tags: {
        url: content.url,
        title: content.title,
        content_id: content.id,
      },
    })
    return StorySchema.parse(existingStory)
  }

  try {
    await trackEvent({
      channel: 'sage',
      event: 'Summarization Started',
      description: `Starting AI summarization for: ${content.title}`,
      icon: '🤖',
      tags: {
        url: content.url,
        title: content.title,
        content_id: content.id,
      },
    })

    const response = await client.responses.create({
      input: await input(content),
      instructions: instructions(),
      model: 'gpt-4o',
    })

    await trackEvent({
      channel: 'sage',
      event: 'Summarization Completed',
      description: response.output_text,
      icon: '✅',
      tags: {
        url: content.url,
        title: content.title,
        model: 'gpt-4o',
      },
    })

    const { title, keyFindings } = parseResponse(response.output_text)

    const [story] = await db.insert(stories).values({
      contentId: content.id,
      url: content.url,
      newsId: news.id,
      title: content.title,
      snippet: keyFindings,
    }).returning()

    return StorySchema.parse(story)

  } catch (error) {
    await trackEvent({
      channel: 'sage',
      event: 'Summarization Failed',
      description: `AI summarization failed for: ${content.title}`,
      icon: '❌',
      tags: {
        url: content.url,
        title: content.title,
        error: String(error),
      },
    })
    return null
  }
}

export const sage = async ({contents, news}: {contents: Content[], news: News}): Promise<Story[]> => {
  try {
    await trackEvent({
      channel: 'sage',
      event: 'Sage Processing Started',
      description: `Starting to process ${contents.length} content items for summarization`,
      icon: '🧙‍♂️',
      tags: {
        content_count: contents.length,
      },
    })

    const queue = new PQueue({ concurrency: 3 })
    const results = await Promise.all(
      contents.map((content) => queue.add(async () => summarize({content, news}))),
    )
    
    const filteredResults = results.filter((result): result is Story => result !== null)

    await trackEvent({
      channel: 'sage',
      event: 'Sage Processing Completed',
      description: `Processed ${filteredResults.length}/${contents.length} content items`,
      icon: '✅',
      tags: {
        content_attempted: contents.length,
        stories_created: filteredResults.length,
        success_rate: Math.round((filteredResults.length / contents.length) * 100),
      },
    })

    return filteredResults
  } catch (error) {
    await trackEvent({
      channel: 'sage',
      event: 'Sage Processing Failed',
      description: `Sage processing failed: ${String(error)}`,
      icon: '💥',
      tags: {
        content_count: contents.length,
        error: String(error),
      },
    })
    throw error
  }
}
