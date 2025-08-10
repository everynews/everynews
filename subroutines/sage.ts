import { db } from '@everynews/database'
import { prepareContentInput } from '@everynews/lib/prompts'
import { getDefaultPromptContent } from '@everynews/lib/prompts/default-prompt'
import { getSystemPromptContentForStructuredOutput } from '@everynews/lib/prompts/system-prompt'
import { track } from '@everynews/logs'
import {
  type Alert,
  type Content,
  LANGUAGE_CODES,
  LANGUAGE_LABELS,
  prompt,
  type Story,
  type StoryMetadata,
  StorySchema,
  stories,
} from '@everynews/schema'
import { and, eq, isNull } from 'drizzle-orm'
import normalizeUrl from 'normalize-url'
import OpenAI from 'openai'
import PQueue from 'p-queue'
import { z } from 'zod'
import type { CuratorResult } from './curators/type'

const client = new OpenAI()

const model = 'o4-mini'

const SummaryResponseSchema = z.object({
  importance: z
    .number()
    .int()
    .min(0)
    .max(100)
    .describe('Importance score from 0 to 100'),
  keyFindings: z
    .array(z.string())
    .describe('Array of key findings in plain text'),
  languageCode: z
    .enum(LANGUAGE_CODES)
    .describe('Language code for the summary'),
  title: z
    .string()
    .describe('The summarized title in plain text (no markdown)'),
})

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
  metadata,
}: {
  content: Content
  news: Alert
  metadata?: StoryMetadata
}): Promise<Omit<Story, 'id' | 'createdAt' | 'updatedAt'> | null> => {
  try {
    const { fullPrompt } = await input({ content, news })

    const systemInstructions = getSystemPromptContentForStructuredOutput(
      news.languageCode,
    )

    const response = await client.chat.completions.create({
      messages: [
        {
          content: systemInstructions,
          role: 'system',
        },
        {
          content: fullPrompt,
          role: 'user',
        },
      ],
      model,
      response_format: {
        json_schema: {
          name: 'content_summary',
          schema: {
            additionalProperties: false,
            properties: {
              importance: {
                description: 'Importance score from 0 to 100',
                maximum: 100,
                minimum: 0,
                type: 'integer',
              },
              keyFindings: {
                description: `Array of key findings in plain text in ${LANGUAGE_LABELS[news.languageCode]} (${news.languageCode})`,
                items: {
                  type: 'string',
                },
                type: 'array',
              },
              languageCode: {
                description: `Language code for the summary`,
                enum: LANGUAGE_CODES as unknown as string[],
                type: 'string',
              },
              title: {
                description: `The summarized title in plain text (no markdown) in ${LANGUAGE_LABELS[news.languageCode]} (${news.languageCode})`,
                type: 'string',
              },
            },
            required: ['title', 'keyFindings', 'importance', 'languageCode'],
            type: 'object',
          },
          strict: true,
        },
        type: 'json_schema',
      },
    })

    const parsedResponse = SummaryResponseSchema.parse(
      JSON.parse(response.choices[0].message.content || '{}'),
    )

    const { title, keyFindings, importance, languageCode } = parsedResponse

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
        description: keyFindings?.length
          ? keyFindings.join('\n')
          : 'No key findings',
        event: `(${languageCode}) ${title}`,
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
      metadata: metadata || null,
      originalUrl: content.originalUrl,
      promptId: news.promptId,
      systemMarkedIrrelevant: isSystemIrrelevant,
      title,
      url: content.url,
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
  metadata,
}: {
  content: Content
  news: Alert
  metadata?: StoryMetadata
}): Promise<Story | null> => {
  const url = normalizeUrl(content.url, {
    stripProtocol: true,
    stripWWW: true,
  })

  // Check for existing story with same URL, same prompt ID, and same language
  const existingStory = await db.query.stories.findFirst({
    where: and(
      eq(stories.url, url),
      news.promptId === null
        ? isNull(stories.promptId)
        : eq(stories.promptId, news.promptId),
      eq(stories.languageCode, news.languageCode),
      isNull(stories.deletedAt),
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
        normalized_url: url,
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
      prompt_id: news.promptId || 'default',
      title: content.title.slice(0, 160),
      type: 'info',
      url: content.url.slice(0, 160),
    },
  })

  // Get the summary without database operations
  const summary = await summarizeContent({ content, metadata, news })
  if (!summary) {
    return null
  }

  if (summary.title.length === 0 || summary.keyFindings?.length === 0) {
    return null
  }

  const [story] = await db.insert(stories).values(summary).returning()
  return StorySchema.parse(story)
}

export const sage = async ({
  contents,
  curatorResults,
  news,
}: {
  contents: Content[]
  curatorResults: CuratorResult[]
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

    // Create a map of URL to metadata for easy lookup
    const urlToMetadata = new Map<string, StoryMetadata>()
    for (const result of curatorResults) {
      const normalizedUrl = normalizeUrl(result.url, {
        stripProtocol: true,
        stripWWW: true,
      })
      if (result.metadata) {
        urlToMetadata.set(normalizedUrl, result.metadata)
      }
    }

    const queue = new PQueue({ concurrency: 16 })
    const results = await Promise.all(
      contents.map((content) => {
        const normalizedContentUrl = normalizeUrl(content.url, {
          stripProtocol: true,
          stripWWW: true,
        })
        const metadata = urlToMetadata.get(normalizedContentUrl)
        return queue.add(async () =>
          summarizeWithCache({ content, metadata, news }),
        )
      }),
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
