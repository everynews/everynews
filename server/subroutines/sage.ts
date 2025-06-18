import { createHash } from 'node:crypto'
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

const hashPrompt = (promptContent: string): string => {
  return createHash('sha256').update(promptContent).digest('hex')
}

const input = async ({ content, news }: { content: Content; news: Alert }) => {
  let userPrompt = getDefaultPromptContent()

  if (news.promptId) {
    const customPrompt = await db.query.prompt.findFirst({
      where: and(eq(prompt.id, news.promptId), isNull(prompt.deletedAt)),
    })
    if (customPrompt) {
      userPrompt = customPrompt.content
    }
  }
  return {
    fullPrompt: `${userPrompt}\n\n$TEXT: """\n${await prepareContentInput(content)}\n"""`,
    promptContent: userPrompt,
  }
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
    const { fullPrompt, promptContent } = await input({ content, news })
    const response = await client.responses.create({
      input: fullPrompt,
      instructions: getSystemPromptContent(news.language),
      model,
    })

    const { title, keyFindings, importance, languageCode } =
      parsePromptResponse(response.output_text)

    const isSystemIrrelevant = importance === 0

    if (isSystemIrrelevant) {
      await track({
        channel: 'sage',
        description: `Marked as irrelevant by system: ${content.title}`,
        event: 'System Marked Irrelevant',
        icon: '⏭️',
        tags: {
          content_id: content.id,
          model,
          original_title: content.title.slice(0, 160),
          type: 'info',
          url: content.url.slice(0, 160),
        },
      })
    } else {
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
    }

    return {
      alertId: news.id,
      contentId: content.id,
      deletedAt: null,
      keyFindings,
      languageCode,
      promptHash: hashPrompt(promptContent),
      promptId: news.promptId,
      systemMarkedIrrelevant: isSystemIrrelevant,
      title,
      url: normalizeUrl(content.url, {
        stripProtocol: true,
        stripWWW: true,
      }),
      userMarkedIrrelevant: false,
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

  // Get the prompt content to calculate hash
  let userPrompt = getDefaultPromptContent()
  if (news.promptId) {
    const customPrompt = await db.query.prompt.findFirst({
      where: and(eq(prompt.id, news.promptId), isNull(prompt.deletedAt)),
    })
    if (customPrompt) {
      userPrompt = customPrompt.content
    }
  }
  const promptHash = hashPrompt(userPrompt)

  // Check for existing story with same URL and same prompt hash
  const existingStory = await db.query.stories.findFirst({
    where: and(
      eq(stories.url, url),
      eq(stories.promptHash, promptHash),
      isNull(stories.deletedAt),
    ),
  })

  if (existingStory) {
    await track({
      channel: 'sage',
      description: `Found existing summary for: ${content.title} (same prompt content)`,
      event: 'Story Cache Hit',
      icon: '💾',
      tags: {
        content_id: content.id,
        existing_prompt_hash: existingStory.promptHash.slice(0, 8),
        normalized_url: url,
        prompt_hash: promptHash.slice(0, 8),
        prompt_id: news.promptId || 'default',
        story_id: existingStory.id,
        title: content.title.slice(0, 160),
        type: 'info',
        url: content.url.slice(0, 160),
      },
    })
    return StorySchema.parse(existingStory)
  }

  // Track cache miss
  await track({
    channel: 'sage',
    description: `Cache miss - processing new content: ${content.title}`,
    event: 'Story Cache Miss',
    icon: '🔄',
    tags: {
      content_id: content.id,
      normalized_url: url,
      prompt_hash: promptHash.slice(0, 8),
      prompt_id: news.promptId || 'default',
      title: content.title.slice(0, 160),
      type: 'info',
      url: content.url.slice(0, 160),
    },
  })

  // Get the summary without database operations
  const summary = await summarizeContent({ content, news })
  if (!summary) {
    return null
  }

  // Insert into database
  try {
    const [story] = await db
      .insert(stories)
      .values({
        alertId: summary.alertId,
        contentId: summary.contentId,
        keyFindings: summary.keyFindings,
        languageCode: summary.languageCode,
        promptHash: summary.promptHash,
        promptId: summary.promptId,
        systemMarkedIrrelevant: summary.systemMarkedIrrelevant,
        title: summary.title,
        url: summary.url,
        userMarkedIrrelevant: summary.userMarkedIrrelevant,
      })
      .returning()

    return StorySchema.parse(story)
  } catch (error: any) {
    // If we hit a unique constraint violation, it means another process
    // inserted the same story between our check and insert
    if (
      error.code === '23505' &&
      error.constraint === 'stories_url_prompt_hash_unique'
    ) {
      await track({
        channel: 'sage',
        description: `Race condition detected - story was inserted by another process: ${content.title}`,
        event: 'Story Insert Race Condition',
        icon: '🏁',
        tags: {
          content_id: content.id,
          normalized_url: url,
          prompt_hash: promptHash.slice(0, 8),
          title: content.title.slice(0, 160),
          type: 'warning',
        },
      })

      // Try to fetch the story that was just inserted
      const existingStory = await db.query.stories.findFirst({
        where: and(
          eq(stories.url, url),
          eq(stories.promptHash, promptHash),
          isNull(stories.deletedAt),
        ),
      })

      if (existingStory) {
        return StorySchema.parse(existingStory)
      }
    }
    throw error
  }
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
