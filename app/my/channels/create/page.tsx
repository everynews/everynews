import { whoami } from '@everynews/auth/session'
import { redirect } from 'next/navigation'
import { ChannelCreatePage } from './channel-create-page'

export const metadata = {
  description: 'Create a new delivery channel.',
  title: 'Create Channel',
}

export default async function CreateChannelPage() {
  const user = await whoami()
  if (!user) {
    redirect('/sign-in')
  }

  return <ChannelCreatePage />
}
