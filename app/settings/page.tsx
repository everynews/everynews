import { whoami } from '@everynews/auth/session'
import { UpdateProfileForm } from '@everynews/components/settings/update-profile-form'
import { db } from '@everynews/database'
import { users } from '@everynews/schema'
import { eq } from 'drizzle-orm'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  description: 'Update your personal information',
  title: 'Profile Settings',
}

export default async function SettingsPage() {
  const sessionUser = await whoami()
  if (!sessionUser) {
    redirect('/')
  }

  const [fullUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, sessionUser.id))

  if (!fullUser) {
    redirect('/')
  }

  return (
    <div className='flex flex-col gap-6'>
      <div>
        <h1 className='text-3xl font-bold'>Profile</h1>
        <p className='text-muted-foreground'>
          Update your personal information
        </p>
      </div>

      <UpdateProfileForm user={fullUser} />
    </div>
  )
}
