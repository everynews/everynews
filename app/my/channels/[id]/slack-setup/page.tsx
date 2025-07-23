import { guardUser } from '@everynews/auth/session'
import { SlackChannelSelector } from '@everynews/components/slack-channel-selector'
import { SlackTestButton } from '@everynews/components/slack-test-button'
import { db } from '@everynews/database'
import {
  ChannelSchema,
  channels,
  SlackChannelConfigSchema,
} from '@everynews/schema/channel'
import { and, eq, isNull } from 'drizzle-orm'
import { notFound } from 'next/navigation'

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
  const user = await guardUser()

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

  const config = SlackChannelConfigSchema.parse(channel.config)

  return (
    <>
      <div className='mb-6 md:mb-8'>
        <h1 className='text-2xl md:text-3xl font-bold'>Setup Slack Channel</h1>
        <p className='text-base text-muted-foreground mt-2'>
          {config.workspace?.name || config.teamId
            ? `Currently connected to ${config.workspace?.name || config.teamId}. `
            : 'Select a channel to receive your alerts. '}
          Everynews bot must have permission to send messages in the selected
          channel.
        </p>
      </div>

      <SlackChannelSelector channelId={id} />

      {config.channel?.id && (
        <div className='mt-6 md:mt-8 pt-6 md:pt-8 border-t'>
          <div className='text-sm text-muted-foreground mb-2'>
            To test other channels, first save and refresh the page.
          </div>
          <SlackTestButton
            channel={channel}
            variant='outline'
            className='w-full md:w-auto'
          />
        </div>
      )}
    </>
  )
}
