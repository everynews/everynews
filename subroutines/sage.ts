import { createHash } from 'node:crypto'
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
  StorySchema,
  stories,
} from '@everynews/schema'
import { and, eq, isNull } from 'drizzle-orm'
import normalizeUrl from 'normalize-url'
import OpenAI from 'openai'
import PQueue from 'p-queue'
import { z } from 'zod'

const client = new OpenAI()

const model = 'gpt-4o'

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

    const systemInstructions = getSystemPromptContentForStructuredOutput(
      news.language,
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
                description: `Array of key findings in plain text in ${LANGUAGE_LABELS[news.language]} (${news.language})`,
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
                description: `The summarized title in plain text (no markdown) in ${LANGUAGE_LABELS[news.language]} (${news.language})`,
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
      originalUrl: content.originalUrl,
      promptHash: hashPrompt(promptContent),
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

  if (summary.title.length === 0 || summary.keyFindings?.length === 0) {
    return null
  }

  const [story] = await db.insert(stories).values(summary).returning()
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

    const queue = new PQueue({ concurrency: 16 })
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
