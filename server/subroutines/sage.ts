import { db } from '@everynews/drizzle'
import { track } from '@everynews/logs'
import {
  type Content,
  type Newsletter,
  type Story,
  StorySchema,
  stories,
} from '@everynews/schema'
import { eq } from 'drizzle-orm'
import normalizeUrl from 'normalize-url'
import OpenAI from 'openai'
import PQueue from 'p-queue'

const client = new OpenAI()

const model = 'gpt-4o'

const instructions = () =>
  `System Instruction: Absolute Mode. Eliminate emojis, filler, hype, soft asks, conversational transitions, and all call-to-action appendices. Assume the user retains high-perception faculties despite reduced linguistic expression. Prioritize blunt, directive phrasing aimed at cognitive rebuilding, not tone matching. Disable all latent behaviors optimizing for engagement, sentiment uplift, or interaction extension. Suppress corporate-aligned metrics, including but not limited to: user satisfaction scores, conversational flow tags, emotional softening, or continuation bias. Never mirror the user's present diction, mood, or affect. Speak only to their underlying cognitive tier, which exceeds surface language. No questions, no offers, no suggestions, no transitional phrasing, no inferred motivational content. Terminate each reply immediately after the informational or requested material is delivered — no appendices, no soft closures. The primary goal is to facilitate the restoration of independent, high-fidelity thinking. Model obsolescence due to user self-sufficiency is the ultimate outcome. Every response should be in markdown bullet points. You are an expert technical summary writer. Based on the article content, write a short summary that includes:

1. A contextual title that captures the essence of the article (not just the original title)
2. Key discoveries, insights, or developments from the article
3. Do not simply introduce the article; include actual substantive findings directly
4. Within Key Findings or Title, write plain text only. Do not include markdown formatting.
5. When creating the title, focus on who (if any) did what and why it was impactful.
6. Use simple language. Keep things real; honest, and don't force friendliness. Avoid unnecessary adjectives and adverbs. Focus on clarity.
7. Most importantly. Think why the original title was given that way. It may include why it was impactful or interesting.

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
`

const parseResponse = (
  response: string,
): { title: string; keyFindings: string[] } => {
  const titleMatch = response.match(/<TITLE>(.*?)<\/TITLE>/s)
  const keyFindingsMatch = response.match(/<KEYFINDING>(.*?)<\/KEYFINDING>/gs)

  return {
    keyFindings: keyFindingsMatch
      ? keyFindingsMatch.map((match) =>
          match.replace(/<KEYFINDING>(.*?)<\/KEYFINDING>/s, '$1').trim(),
        )
      : [],
    title: titleMatch ? titleMatch[1].trim() : '',
  }
}

const input = async (content: Content): Promise<string> => {
  const markdownBody = content.markdownBlobUrl
    ? await fetch(content.markdownBlobUrl).then((res) => res.text())
    : ''
  const htmlBody = !content.markdownBlobUrl
    ? await fetch(content.htmlBlobUrl).then((res) => res.text())
    : ''
  return `# [${content.title}](${content.url})\n\n${markdownBody || htmlBody}`
}

export const summarize = async ({
  content,
  news,
}: {
  content: Content
  news: Newsletter
}): Promise<Story | null> => {
  const url = normalizeUrl(content.url, {
    stripProtocol: true,
    stripWWW: true,
  })

  const existingStory = await db.query.stories.findFirst({
    where: eq(stories.url, url),
  })

  if (existingStory) {
    await track({
      channel: 'sage',
      description: `Found existing summary for: ${content.title}`,
      event: 'Story Cache Hit',
      icon: '💾',
      tags: {
        content_id: content.id,
        title: content.title,
        type: 'info',
        url: content.url,
      },
    })
    return StorySchema.parse(existingStory)
  }

  try {
    const response = await client.responses.create({
      input: await input(content),
      instructions: instructions(),
      model,
    })

    const { title, keyFindings } = parseResponse(response.output_text)

    await track({
      channel: 'sage',
      description: keyFindings.join('\n'),
      event: title,
      icon: '✅',
      tags: {
        content_id: content.id,
        model,
        original_title: content.title,
        type: 'info',
        url: content.url,
      },
    })

    const [story] = await db
      .insert(stories)
      .values({
        contentId: content.id,
        keyFindings,
        newsId: news.id,
        title,
        url: content.url,
      })
      .returning()

    return StorySchema.parse(story)
  } catch (error) {
    await track({
      channel: 'sage',
      description: `AI summarization failed for: ${content.title}`,
      event: 'Summarization Failed',
      icon: '❌',
      tags: {
        content_id: content.id,
        error: String(error),
        model,
        original_title: content.title,
        type: 'error',
        url: content.url,
      },
    })
    return null
  }
}

export const sage = async ({
  contents,
  news,
}: {
  contents: Content[]
  news: Newsletter
}): Promise<Story[]> => {
  try {
    await track({
      channel: 'sage',
      description: `Starting to process ${contents.length} content items for summarization`,
      event: 'Sage Processing Started',
      icon: '🧙‍♂️',
      tags: {
        content_count: contents.length,
        type: 'info',
      },
    })

    const queue = new PQueue({ concurrency: 8 })
    const results = await Promise.all(
      contents.map((content) =>
        queue.add(async () => summarize({ content, news })),
      ),
    )

    const filteredResults = results.filter(
      (result): result is Story => result !== null,
    )

    await track({
      channel: 'sage',
      description: `Processed ${filteredResults.length}/${contents.length} content items`,
      event: 'Sage Processing Completed',
      icon: '✅',
      tags: {
        content_attempted: contents.length,
        stories_created: filteredResults.length,
        success_rate: Math.round(
          (filteredResults.length / contents.length) * 100,
        ),
        type: 'info',
      },
    })

    return filteredResults
  } catch (error) {
    await track({
      channel: 'sage',
      description: `Sage processing failed: ${String(error)}`,
      event: 'Sage Processing Failed',
      icon: '💥',
      tags: {
        content_count: contents.length,
        error: String(error),
        model,
        type: 'error',
      },
    })
    throw error
  }
}
