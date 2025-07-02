import { whoami } from '@everynews/auth/session'
import { DiscordChannelSelector } from '@everynews/components/discord-channel-selector'
import { DiscordTestButton } from '@everynews/components/discord-test-button'
import { db } from '@everynews/database'
import { ChannelSchema, channels } from '@everynews/schema/channel'
import { and, eq, isNull } from 'drizzle-orm'
import { notFound, unauthorized } from 'next/navigation'

export const metadata = {
  description: 'Select a Discord channel for your alerts',
  title: 'Discord Channel Setup',
}

interface DiscordSetupPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function DiscordSetupPage({
  params,
}: DiscordSetupPageProps) {
  const { id } = await params
  const user = await whoami()
  if (!user) return unauthorized()

  // Verify channel exists and belongs to user
  const channelData = await db.query.channels.findFirst({
    where: and(
      eq(channels.id, id),
      eq(channels.userId, user.id),
      eq(channels.type, 'discord'),
      isNull(channels.deletedAt),
    ),
  })

  if (!channelData) return notFound()

  const channel = ChannelSchema.parse(channelData)

  // Type assertion since we already filtered for discord type
  if (channel.type !== 'discord') return notFound()

  const config = channel.config

  return (
    <div className='container mx-auto max-w-3xl px-4 py-6 md:py-8'>
      <div className='mb-6 md:mb-8'>
        <h1 className='text-2xl md:text-3xl font-bold'>
          Setup Discord Channel
        </h1>
        <p className='text-base text-muted-foreground mt-2'>
          {config.guild?.name || config.guildId
            ? `Connected to ${config.guild?.name || config.guildId}`
            : 'Select a channel to receive your alerts'}
        </p>
      </div>

      <div className='rounded-lg border bg-card p-6 md:p-8'>
        <h2 className='text-lg md:text-xl font-semibold mb-4'>
          Select Channel
        </h2>
        <p className='text-sm text-muted-foreground mb-6 md:mb-8'>
          Choose which Discord channel should receive your alert notifications.
          The Everynews bot must have permission to send messages in the
          selected channel.
        </p>

        <DiscordChannelSelector channelId={id} />

        {config.channel?.id && (
          <div className='mt-6 md:mt-8 pt-6 md:pt-8 border-t'>
            <DiscordTestButton
              channel={channel}
              variant='outline'
              className='w-full md:w-auto'
            />
          </div>
        )}
      </div>
    </div>
  )
}
