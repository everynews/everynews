import { db } from '@everynews/database'
import {
  parsePromptResponse,
  prepareContentInput,
} from '@everynews/lib/prompts'
import { getDefaultPromptContent } from '@everynews/lib/prompts/default-prompt'
import { getSystemPromptContent } from '@everynews/lib/prompts/system-prompt'
import { track } from '@everynews/logs'
import {
  type Alert,
  type Content,
  prompt,
  type Story,
  StorySchema,
  stories,
} from '@everynews/schema'
import { and, eq, isNull } from 'drizzle-orm'
import normalizeUrl from 'normalize-url'
import OpenAI from 'openai'
import PQueue from 'p-queue'

const client = new OpenAI()

const model = 'gpt-4o'

const input = async ({ content, news }: { content: Content; news: Alert }) => {
  let userPrompt = getDefaultPromptContent()

  if (news.promptId) {
    const customPrompt = await db.query.prompt.findFirst({
      where: eq(prompt.id, news.promptId),
    })
    if (customPrompt) {
      userPrompt = customPrompt.content
    }
  }
  return `${userPrompt}\n\n$TEXT: """\n${await prepareContentInput(content)}\n"""`
}

// Pure function that only does summarization without database operations
export const summarizeContent = async ({
  content,
  news,
}: {
  content: Content
  news: Alert
}): Promise<Omit<Story, 'id' | 'createdAt' | 'updatedAt'> | null> => {
  try {
    const response = await client.responses.create({
      input: await input({ content, news }),
      instructions: getSystemPromptContent(news.language),
      model,
    })

    const { title, keyFindings, importance, languageCode } =
      parsePromptResponse(response.output_text)

    if (importance === 0) {
      await track({
        channel: 'sage',
        description: `Skipped irrelevant content: ${content.title}`,
        event: 'Irrelevant Content Skipped',
        icon: '⏭️',
        tags: {
          content_id: content.id,
          model,
          original_title: content.title.slice(0, 160),
          type: 'info',
          url: content.url.slice(0, 160),
        },
      })
      return null
    }

    await track({
      channel: 'sage',
      description: keyFindings.join('\n'),
      event: title,
      icon: '✅',
      tags: {
        content_id: content.id,
        model,
        original_title: content.title.slice(0, 160),
        type: 'info',
        url: content.url.slice(0, 160),
      },
    })

    return {
      alertId: news.id,
      contentId: content.id,
      irrelevant: false,
      keyFindings,
      languageCode,
      promptId: news.promptId,
      title,
      url: content.url,
    }
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
        original_title: content.title.slice(0, 160),
        type: 'error',
        url: content.url.slice(0, 160),
      },
    })
    return null
  }
}

// Function that handles summarization with database caching
const summarizeWithCache = async ({
  content,
  news,
}: {
  content: Content
  news: Alert
}): Promise<Story | null> => {
  const url = normalizeUrl(content.url, {
    stripProtocol: true,
    stripWWW: true,
  })

  // Check for existing story with same URL and same prompt
  const currentPromptId = news.promptId
  const existingStory = await db.query.stories.findFirst({
    where: and(
      eq(stories.url, url),
      currentPromptId
        ? eq(stories.promptId, currentPromptId)
        : isNull(stories.promptId),
    ),
  })

  if (existingStory) {
    await track({
      channel: 'sage',
      description: `Found existing summary for: ${content.title} (same prompt)`,
      event: 'Story Cache Hit',
      icon: '💾',
      tags: {
        content_id: content.id,
        prompt_id: currentPromptId || 'default',
        title: content.title.slice(0, 160),
        type: 'info',
        url: content.url.slice(0, 160),
      },
    })
    return StorySchema.parse(existingStory)
  }

  // Check if there's an existing story with same URL but different prompt
  const existingDifferentPrompt = await db.query.stories.findFirst({
    where: eq(stories.url, url),
  })

  if (
    existingDifferentPrompt &&
    existingDifferentPrompt.promptId !== currentPromptId
  ) {
    await track({
      channel: 'sage',
      description: `Found existing story but different prompt - regenerating: ${content.title}`,
      event: 'Story Cache Miss (Different Prompt)',
      icon: '🔄',
      tags: {
        content_id: content.id,
        current_prompt_id: currentPromptId || 'default',
        existing_prompt_id: existingDifferentPrompt.promptId || 'default',
        title: content.title.slice(0, 160),
        type: 'info',
        url: content.url.slice(0, 160),
      },
    })
  }

  // Get the summary without database operations
  const summary = await summarizeContent({ content, news })
  if (!summary) {
    return null
  }

  // Insert into database
  const [story] = await db
    .insert(stories)
    .values({
      alertId: summary.alertId,
      contentId: summary.contentId,
      keyFindings: summary.keyFindings,
      languageCode: summary.languageCode,
      promptId: summary.promptId,
      title: summary.title,
      url: summary.url,
    })
    .returning()

  return StorySchema.parse(story)
}

export const sage = async ({
  contents,
  news,
}: {
  contents: Content[]
  news: Alert
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
        queue.add(async () => summarizeWithCache({ content, news })),
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
