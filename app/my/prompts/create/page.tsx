import { whoami } from '@everynews/auth/session'
import { getDefaultPromptContent } from '@everynews/lib/prompts'
import { redirect } from 'next/navigation'
import { PromptCreatePage } from './prompt-create-page'

export const dynamic = 'force-dynamic'

export default async function CreatePromptPage() {
  const user = await whoami()
  if (!user) {
    redirect('/')
  }

  const defaultPromptContent = await getDefaultPromptContent()

  return <PromptCreatePage defaultPromptContent={defaultPromptContent} />
}
