import { whoami } from '@everynews/auth/session'
import { ChannelForm } from '@everynews/components/channel-detail'
import { db } from '@everynews/drizzle'
import { ChannelSchema, channels } from '@everynews/schema/channel'
import { eq } from 'drizzle-orm'
import { notFound, unauthorized } from 'next/navigation'
import { Suspense } from 'react'

export default async function EditChannelPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await whoami()
  if (!user) return unauthorized()

  const item = await db.query.channels.findFirst({
    where: eq(channels.id, id),
  })

  if (!item) notFound()
  if (item.userId !== user.id) unauthorized()

  const channel = ChannelSchema.parse(item)

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChannelForm mode='edit' original={channel} />
    </Suspense>
  )
}
