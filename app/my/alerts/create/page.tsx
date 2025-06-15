import { whoami } from '@everynews/auth/session'
import { db } from '@everynews/database'
import { prompt } from '@everynews/schema/prompt'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { AlertCreatePage } from './alert-create-page'

export const metadata = {
  description: 'Create a new alert to monitor news.',
  title: 'Create Alert',
}

export default async function CreateAlertPage() {
  const user = await whoami()
  if (!user) {
    redirect('/sign-in')
  }

  // Get user's prompts
  const prompts = await db
    .select()
    .from(prompt)
    .where(eq(prompt.userId, user.id))

  return <AlertCreatePage prompts={prompts} />
}
