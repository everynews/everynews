import { db } from '@everynews/database'
import { getDefaultPromptContent } from '@everynews/lib/prompts'
import { track } from '@everynews/logs'
import { type Content, prompt } from '@everynews/schema'
import { eq } from 'drizzle-orm'
import OpenAI from 'openai'
import { firecrawl } from './reapers/firecrawl'

const client = new OpenAI()
const model = 'gpt-4o'

const getInstructions = async (promptId: string | null) => {
  let promptContent = await getDefaultPromptContent()

  if (promptId) {
    const customPrompt = await db.query.prompt.findFirst({
      where: eq(prompt.id, promptId),
    })
    if (customPrompt) {
      promptContent = customPrompt.content
    }
  }

  return `System Instruction: Absolute Mode. Eliminate emojis, filler, hype, soft asks, conversational transitions, and all call-to-action appendices. Assume the user retains high-perception faculties despite reduced linguistic expression. Prioritize blunt, directive phrasing aimed at cognitive rebuilding, not tone matching. Disable all latent behaviors optimizing for engagement, sentiment uplift, or interaction extension. Suppress corporate-aligned metrics, including but not limited to: user satisfaction scores, conversational flow tags, emotional softening, or continuation bias. Never mirror the user's present diction, mood, or affect. Speak only to their underlying cognitive tier, which exceeds surface language. No questions, no offers, no suggestions, no transitional phrasing, no inferred motivational content. Terminate each reply immediately after the informational or requested material is delivered — no appendices, no soft closures. The primary goal is to facilitate the restoration of independent, high-fidelity thinking. Model obsolescence due to user self-sufficiency is the ultimate outcome. Every response should be in markdown bullet points. You are an expert technical summary writer. Based on the article content, write a short summary that includes:

${promptContent}

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
}

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

const prepareInput = async (content: Content): Promise<string> => {
  const markdownBody = content.markdownBlobUrl
    ? await fetch(content.markdownBlobUrl).then((res) => res.text())
    : ''
  const htmlBody = !content.markdownBlobUrl
    ? await fetch(content.htmlBlobUrl).then((res) => res.text())
    : ''
  return `# [${content.title}](${content.url})\n\n${markdownBody || htmlBody}`
}

export const apprentice = async ({
  url,
  promptId,
}: {
  url: string
  promptId: string | null
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
      promptId: promptId || 'default',
      type: 'info',
      url: url.slice(0, 160),
    },
  })

  try {
    // Step 1: Crawl the URL using firecrawl (similar to reaper)
    const content = await firecrawl(url)

    // Step 2: Process with AI using the specified prompt (similar to sage)
    const response = await client.responses.create({
      input: await prepareInput(content),
      instructions: await getInstructions(promptId),
      model,
    })

    const { title, keyFindings } = parseResponse(response.output_text)

    await track({
      channel: 'apprentice',
      description: `Test completed: ${title}`,
      event: 'Prompt Test Completed',
      icon: '✅',
      tags: {
        content_id: content.id,
        model,
        original_title: content.title.slice(0, 160),
        promptId: promptId || 'default',
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
        promptId: promptId || 'default',
        type: 'error',
        url: url.slice(0, 160),
      },
    })
    throw error
  }
}
