import { whoami } from '@everynews/auth/session'
import { db } from '@everynews/database'
import { prompt } from '@everynews/schema'
import { and, eq } from 'drizzle-orm'
import { notFound, redirect } from 'next/navigation'
import { PromptDetailPage } from './prompt-detail-page'

export const dynamic = 'force-dynamic'

export default async function PromptPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await whoami()
  if (!user) {
    redirect('/')
  }

  const promptData = await db.query.prompt.findFirst({
    where: and(eq(prompt.id, id), eq(prompt.userId, user.id)),
  })

  if (!promptData) {
    notFound()
  }

  return <PromptDetailPage prompt={promptData} />
}
