import { whoami } from '@everynews/auth/session'
import { unauthorized } from 'next/navigation'
import { PromptCreatePage } from './prompt-create-page'

export const metadata = {
  description: 'Start a new prompt for filtering content.',
  title: 'Create Prompt',
}

export default async function CreatePromptPage() {
  const user = await whoami()
  if (!user) {
    unauthorized()
  }
  return <PromptCreatePage />
}
