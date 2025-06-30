import { whoami } from '@everynews/auth/session'
import { DeleteAccountSection } from '@everynews/components/settings/delete-account-section'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@everynews/components/ui/card'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  description: 'Irreversible account actions',
  title: 'Danger Zone',
}

export default async function DangerPage() {
  const user = await whoami()
  if (!user) {
    redirect('/')
  }

  return (
    <div className='flex flex-col gap-6'>
      <div>
        <h1 className='text-3xl font-bold text-destructive'>Danger Zone</h1>
        <p className='text-muted-foreground'>Irreversible account actions</p>
      </div>

      <Card className='border-destructive'>
        <CardHeader>
          <CardTitle className='text-destructive'>Account Deletion</CardTitle>
          <CardDescription>
            Permanently delete your account and all associated data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteAccountSection />
        </CardContent>
      </Card>
    </div>
  )
}
