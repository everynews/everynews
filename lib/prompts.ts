import type { Content } from '@everynews/schema'

export const DEFAULT_PROMPT_PLACEHOLDER =
  'Enter your prompt instructions here...'

export async function prepareContentInput(content: Content): Promise<string> {
  const markdownBody = content.markdownBlobUrl
    ? await fetch(content.markdownBlobUrl).then((res) => res.text())
    : ''
  const htmlBody = !content.markdownBlobUrl
    ? await fetch(content.htmlBlobUrl).then((res) => res.text())
    : ''
  return `# [${content.title}](${content.url})\n\n${markdownBody || htmlBody}`.slice(
    0,
    100_000,
  )
}
