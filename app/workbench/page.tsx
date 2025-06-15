import { whoami } from '@everynews/auth/session'
import { db } from '@everynews/database'
import { PromptSchema, prompt } from '@everynews/schema/prompt'
import { eq } from 'drizzle-orm'
import { unauthorized } from 'next/navigation'
import { WorkbenchPage } from './workbench-page'

export const dynamic = 'force-dynamic'

export const metadata = {
  description: 'Test run alerts with your prompts.',
  title: 'Workbench',
}

export default async function Page() {
  const user = await whoami()
  if (!user) return unauthorized()

  const promptsRes = await db.query.prompt.findMany({
    orderBy: (p, { desc }) => [desc(p.updatedAt)],
    where: eq(prompt.userId, user.id),
  })
  const prompts = PromptSchema.array().parse(promptsRes)

  return <WorkbenchPage prompts={prompts} />
}
