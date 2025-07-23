import { guardUser } from '@everynews/auth/session'
import { redirectToSignIn } from '@everynews/lib/auth-redirect'
import { ChannelCreatePage } from './channel-create-page'

export const metadata = {
  description: 'Create a new delivery channel.',
  title: 'Create Channel',
}

export default async function CreateChannelPage() {
  const user = await guardUser()
  if (!user) {
    return redirectToSignIn('/my/channels/create')
  }

  return <ChannelCreatePage />
}
