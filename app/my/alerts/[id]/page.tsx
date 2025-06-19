import { whoami } from '@everynews/auth/session'
import { db } from '@everynews/database'
import { redirectToSignIn } from '@everynews/lib/auth-redirect'
import { AlertSchema, alerts, prompt } from '@everynews/schema'
import { and, eq, isNull } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { AlertEditPage } from './alert-edit-page'

export const metadata = {
  description: 'Edit your alert settings.',
  title: 'Edit Alert',
}

export default async function EditAlertPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await whoami()
  if (!user) {
    return redirectToSignIn(`/my/alerts/${id}`)
  }

  // Get the alert and verify ownership
  const alertData = AlertSchema.parse(
    await db.query.alerts.findFirst({
      where: and(eq(alerts.id, id), eq(alerts.userId, user.id)),
    }),
  )

  if (!alertData) {
    notFound()
  }

  // Get user's prompts (excluding soft-deleted ones)
  const prompts = await db
    .select()
    .from(prompt)
    .where(and(eq(prompt.userId, user.id), isNull(prompt.deletedAt)))

  return <AlertEditPage alert={alertData} prompts={prompts} />
}
