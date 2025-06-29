import { whoami } from '@everynews/auth/session'
import { SlackChannelSelector } from '@everynews/components/slack-channel-selector'
import { SlackTestButton } from '@everynews/components/slack-test-button'
import { db } from '@everynews/database'
import { ChannelSchema, channels } from '@everynews/schema/channel'
import { and, eq, isNull } from 'drizzle-orm'
import { notFound, unauthorized } from 'next/navigation'

export const metadata = {
  description: 'Select a Slack channel for your alerts',
  title: 'Slack Channel Setup',
}

interface SlackSetupPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function SlackSetupPage({ params }: SlackSetupPageProps) {
  const { id } = await params
  const user = await whoami()
  if (!user) return unauthorized()

  // Verify channel exists and belongs to user
  const channelData = await db.query.channels.findFirst({
    where: and(
      eq(channels.id, id),
      eq(channels.userId, user.id),
      eq(channels.type, 'slack'),
      isNull(channels.deletedAt),
    ),
  })

  if (!channelData) return notFound()

  const channel = ChannelSchema.parse(channelData)

  // Type assertion since we already filtered for slack type
  if (channel.type !== 'slack') return notFound()

  const config = channel.config

  return (
    <div className='container mx-auto max-w-2xl px-4'>
      <div className='mb-4 sm:mb-6'>
        <h1 className='text-2xl sm:text-3xl font-bold'>Setup Slack Channel</h1>
        <p className='text-sm sm:text-base text-muted-foreground mt-1'>
          {config.workspace?.name || config.teamId
            ? `Connected to ${config.workspace?.name || config.teamId}`
            : 'Select a channel to receive your alerts'}
        </p>
      </div>

      <div className='rounded-lg border bg-card p-4 sm:p-6'>
        <h2 className='text-base sm:text-lg font-semibold mb-3 sm:mb-4'>
          Select Channel
        </h2>
        <p className='text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6'>
          Choose which Slack channel should receive your alert notifications.
          You can only select channels where the Everynews bot has been added.
        </p>

        <SlackChannelSelector channelId={id} />

        {config.channel?.id && (
          <div className='mt-3 sm:mt-4 pt-3 sm:pt-4 border-t'>
            <SlackTestButton
              channel={channel}
              variant='outline'
              className='w-full'
            />
          </div>
        )}
      </div>
    </div>
  )
}
