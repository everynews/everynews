import {
  parsePromptResponse,
  prepareContentInput,
} from '@everynews/lib/prompts'
import { track } from '@everynews/logs'
import OpenAI from 'openai'
import { firecrawl } from './reapers/firecrawl'

const client = new OpenAI()
const model = 'gpt-4o'

export const apprentice = async ({
  url,
  promptContent,
}: {
  url: string
  promptContent: string
}): Promise<{
  title: string
  keyFindings: string[]
  url: string
  originalTitle: string
}> => {
  await track({
    channel: 'apprentice',
    description: `Testing prompt on URL: ${url}`,
    event: 'Prompt Test Started',
    icon: '🧪',
    tags: {
      type: 'info',
      url: url.slice(0, 160),
    },
  })

  try {
    // Step 1: Crawl the URL using firecrawl (similar to reaper)
    const content = await firecrawl(url)

    // Step 2: Process with AI using the specified prompt (similar to sage)
    const response = await client.responses.create({
      input: await prepareContentInput(content),
      instructions: promptContent,
      model,
    })

    const { title, keyFindings } = parsePromptResponse(response.output_text)

    await track({
      channel: 'apprentice',
      description: `Test completed: ${title}`,
      event: 'Prompt Test Completed',
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
      keyFindings,
      originalTitle: content.title,
      title,
      url: content.url,
    }
  } catch (error) {
    await track({
      channel: 'apprentice',
      description: `Test failed for URL: ${url}`,
      event: 'Prompt Test Failed',
      icon: '❌',
      tags: {
        error: String(error),
        type: 'error',
        url: url.slice(0, 160),
      },
    })
    throw error
  }
}
