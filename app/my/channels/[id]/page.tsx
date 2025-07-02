import { whoami } from '@everynews/auth/session'
import { db } from '@everynews/database'
import { redirectToSignIn } from '@everynews/lib/auth-redirect'
import { ChannelSchema, channels } from '@everynews/schema/channel'
import { and, eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { ChannelEditPage } from './channel-edit-page'

export const metadata = {
  description: 'Edit your channel settings.',
  title: 'Edit Channel',
}

export default async function EditChannelPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await whoami()
  if (!user) {
    return redirectToSignIn(`/my/channels/${id}`)
  }

  const channelData = ChannelSchema.parse(
    await db.query.channels.findFirst({
      where: and(eq(channels.id, id), eq(channels.userId, user.id)),
    }),
  )

  if (!channelData) {
    notFound()
  }

  return <ChannelEditPage channel={channelData} />
}
