import { whoami } from '@everynews/auth/session'
import { AccountsList } from '@everynews/components/settings/accounts-list'
import { db } from '@everynews/database'
import { accounts } from '@everynews/schema'
import { eq } from 'drizzle-orm'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  description: 'Manage your authentication providers',
  title: 'Connected Accounts',
}

export default async function AccountsPage() {
  const user = await whoami()
  if (!user) {
    redirect('/')
  }

  const accountsList = await db
    .select()
    .from(accounts)
    .where(eq(accounts.userId, user.id))

  return (
    <div className='flex flex-col gap-6'>
      <div>
        <h1 className='text-3xl font-bold'>Connected Accounts</h1>
        <p className='text-muted-foreground'>
          Manage your authentication providers
        </p>
      </div>

      <AccountsList accounts={accountsList} />
    </div>
  )
}
