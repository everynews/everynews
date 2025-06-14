import type { Content } from '@everynews/schema'

export const DEFAULT_PROMPT_PLACEHOLDER =
  'Enter your prompt instructions here...'

export function parsePromptResponse(response: string): {
  title: string
  keyFindings: string[]
} {
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

export async function prepareContentInput(content: Content): Promise<string> {
  const markdownBody = content.markdownBlobUrl
    ? await fetch(content.markdownBlobUrl).then((res) => res.text())
    : ''
  const htmlBody = !content.markdownBlobUrl
    ? await fetch(content.htmlBlobUrl).then((res) => res.text())
    : ''
  return `# [${content.title}](${content.url})\n\n${markdownBody || htmlBody}`
}
