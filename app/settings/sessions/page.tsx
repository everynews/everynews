import { guardUser } from '@everynews/auth/session'
import { SessionsList } from '@everynews/components/settings/sessions-list'
import { db } from '@everynews/database'
import { sessions } from '@everynews/schema'
import { eq } from 'drizzle-orm'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  description: 'View and manage your active sessions',
  title: 'Active Sessions',
}

export default async function SessionsPage() {
  const user = await guardUser()
  if (!user) {
    redirect('/')
  }

  const sessionsList = await db
    .select()
    .from(sessions)
    .where(eq(sessions.userId, user.id))

  return (
    <div className='flex flex-col gap-6'>
      <div>
        <h1 className='text-3xl font-bold'>Active Sessions</h1>
        <p className='text-muted-foreground'>
          View and manage your active sessions
        </p>
      </div>

      <SessionsList sessions={sessionsList} />
    </div>
  )
}
