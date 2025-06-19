import { whoami } from '@everynews/auth/session'
import { db } from '@everynews/database'
import { redirectToSignIn } from '@everynews/lib/auth-redirect'
import { prompt } from '@everynews/schema/prompt'
import { and, eq, isNull } from 'drizzle-orm'
import { humanId } from 'human-id'
import { AlertCreatePage } from './alert-create-page'

export const metadata = {
  description: 'Create a new alert to monitor news.',
  title: 'Create Alert',
}

export default async function CreateAlertPage() {
  const user = await whoami()
  if (!user) {
    return redirectToSignIn('/my/alerts/create')
  }

  // Get user's prompts (excluding soft-deleted ones)
  const prompts = await db
    .select()
    .from(prompt)
    .where(and(eq(prompt.userId, user.id), isNull(prompt.deletedAt)))

  const name = humanId({ capitalize: false, separator: '-' })
  return <AlertCreatePage name={name} prompts={prompts} />
}
