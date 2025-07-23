import { guardUser } from '@everynews/auth/session'
import { db } from '@everynews/database'
import { prompt } from '@everynews/schema'
import { and, eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { PromptDetailPage } from './prompt-detail-page'

export const metadata = {
  description: 'View or edit your prompt configuration.',
  title: 'Prompt Details',
}

export default async function PromptPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await guardUser()

  const promptData = await db.query.prompt.findFirst({
    where: and(eq(prompt.id, id), eq(prompt.userId, user.id)),
  })

  if (!promptData) {
    notFound()
  }

  return <PromptDetailPage prompt={promptData} />
}
