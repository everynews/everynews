import { whoami } from '@everynews/auth/session'
import { AccountsList } from '@everynews/components/settings/accounts-list'
import { DeleteAccountSection } from '@everynews/components/settings/delete-account-section'
import { SessionsList } from '@everynews/components/settings/sessions-list'
import { UpdateProfileForm } from '@everynews/components/settings/update-profile-form'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@everynews/components/ui/card'
import { Separator } from '@everynews/components/ui/separator'
import { db } from '@everynews/database'
import { accounts, sessions, users } from '@everynews/schema'
import { eq } from 'drizzle-orm'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  description: 'Manage your account settings and preferences',
  title: 'Settings',
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

  const [accountsList, sessionsList] = await Promise.all([
    db.select().from(accounts).where(eq(accounts.userId, sessionUser.id)),
    db.select().from(sessions).where(eq(sessions.userId, sessionUser.id)),
  ])

  return (
    <div className='flex flex-col gap-6'>
      <div>
        <h1 className='text-3xl font-bold'>Settings</h1>
        <p className='text-muted-foreground'>
          Manage your account settings and preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent>
          <UpdateProfileForm user={fullUser} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Connected Accounts</CardTitle>
          <CardDescription>
            Manage your authentication providers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AccountsList accounts={accountsList} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>
            View and manage your active sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SessionsList sessions={sessionsList} />
        </CardContent>
      </Card>

      <Separator className='my-6' />

      <Card className='border-destructive'>
        <CardHeader>
          <CardTitle className='text-destructive'>Danger Zone</CardTitle>
          <CardDescription>Irreversible account actions</CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteAccountSection />
        </CardContent>
      </Card>
    </div>
  )
}
