import { whoami } from '@everynews/auth/session'
import { redirect } from 'next/navigation'
import { PromptCreatePage } from './prompt-create-page'

export const dynamic = 'force-dynamic'

export const metadata = {
  description: 'Start a new prompt for filtering content.',
  title: 'Create Prompt',
}

export default async function CreatePromptPage() {
  const user = await whoami()
  if (!user) {
    redirect('/')
  }
  return <PromptCreatePage />
}
