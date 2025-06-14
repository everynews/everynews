import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { whoami } from '@everynews/auth/session'
import { redirect } from 'next/navigation'
import { PromptCreatePage } from './prompt-create-page'

export const dynamic = 'force-dynamic'

export default async function CreatePromptPage() {
  const user = await whoami()
  if (!user) {
    redirect('/')
  }

  let defaultPromptContent = 'Enter your prompt instructions here...'
  try {
    defaultPromptContent = await readFile(
      join(process.cwd(), 'public', 'default-prompt.txt'),
      'utf-8',
    )
  } catch (_error) {
    // Use fallback if file doesn't exist
  }

  return <PromptCreatePage defaultPromptContent={defaultPromptContent} />
}
