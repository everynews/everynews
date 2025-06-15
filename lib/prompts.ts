import type { Content, LanguageCode } from '@everynews/schema'

export const DEFAULT_PROMPT_PLACEHOLDER =
  'Enter your prompt instructions here...'

export function parsePromptResponse(response: string): {
  title: string
  keyFindings: string[]
  importance: number
  languageCode: LanguageCode
} {
  const titleMatch = response.match(/<TITLE>(.*?)<\/TITLE>/s)
  const keyFindingsMatch = response.match(/<KEYFINDING>(.*?)<\/KEYFINDING>/gs)
  const importanceMatch = response.match(/<IMPORTANCE>(.*?)<\/IMPORTANCE>/s)
  const languageCodeMatch = response.match(
    /<LANGUAGECODE>(.*?)<\/LANGUAGECODE>/s,
  )

  return {
    importance: importanceMatch ? parseInt(importanceMatch[1].trim()) || 0 : 0,
    keyFindings: keyFindingsMatch
      ? keyFindingsMatch.map((match) =>
          match.replace(/<KEYFINDING>(.*?)<\/KEYFINDING>/s, '$1').trim(),
        )
      : [],
    languageCode: languageCodeMatch
      ? (languageCodeMatch[1].trim() as LanguageCode)
      : 'en',
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
  return `# [${content.title}](${content.url})\n\n${markdownBody || htmlBody}`.slice(0, 100_000)
}
