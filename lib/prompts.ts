import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export async function getDefaultPromptContent(): Promise<string> {
  try {
    const defaultPromptPath = join(
      process.cwd(),
      'public',
      'default-prompt.txt',
    )
    return await readFile(defaultPromptPath, 'utf8')
  } catch (error) {
    console.error('Failed to read default prompt:', error)
    return 'Enter your prompt instructions here...'
  }
}

export const DEFAULT_PROMPT_PLACEHOLDER =
  'Enter your prompt instructions here...'
