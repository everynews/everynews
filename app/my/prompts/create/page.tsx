import { guardUser } from '@everynews/auth/session'
import { PromptCreatePage } from './prompt-create-page'

export const metadata = {
  description: 'Start a new prompt for filtering content.',
  title: 'Create Prompt',
}

export default async function CreatePromptPage() {
  await guardUser()

  return <PromptCreatePage />
}
