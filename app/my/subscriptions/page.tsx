import { guardUser } from '@everynews/auth/session'
import {
  CardActionsPopover,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@everynews/components/card-actions-popover'
import { ClickableCard } from '@everynews/components/clickable-card'
import { SubscribeAlertDropdownItem } from '@everynews/components/subscribe-alert-dropdown-item'
import { Button } from '@everynews/components/ui/button'
import { db } from '@everynews/database'
import { AlertSchema, alerts } from '@everynews/schema/alert'
import {
  ChannelSchema,
  channels,
  SlackChannelConfigSchema,
} from '@everynews/schema/channel'
import { LANGUAGE_LABELS } from '@everynews/schema/language'
import {
  SubscriptionSchema,
  subscriptions,
} from '@everynews/schema/subscription'
import { and, eq, isNull } from 'drizzle-orm'
import { ExternalLink, Mail, MessageSquare, Phone, Slack } from 'lucide-react'
import Link from 'next/link'
import { z } from 'zod'

export const metadata = {
  description: "Review alerts you're subscribed to.",
  title: 'Subscriptions',
}

const getChannelDestination = (
  channel: z.infer<typeof ChannelSchema> | null,
  userEmail: string,
) => {
  if (!channel) return userEmail

  if (channel.type === 'slack') {
    const config = SlackChannelConfigSchema.safeParse(channel.config)
    if (config.success && config.data.channel) {
      return `#${config.data.channel.name}`
    }
    return 'Not selected'
  } else if (channel.type === 'email' || channel.type === 'phone') {
    const config = z
      .object({ destination: z.string() })
      .safeParse(channel.config)
    return config.success ? config.data.destination : userEmail
  }
  return userEmail
}

export default async function MySubscriptionsPage() {
  const user = await guardUser()

  // Get user's subscriptions with related alert and channel data
  const subscriptionsRes = await db
    .select({
      alert: alerts,
      channel: channels,
      subscription: subscriptions,
    })
    .from(subscriptions)
    .innerJoin(
      alerts,
      and(eq(subscriptions.alertId, alerts.id), isNull(alerts.deletedAt)),
    )
    .leftJoin(
      channels,
      and(eq(subscriptions.channelId, channels.id), isNull(channels.deletedAt)),
    )
    .where(
      and(eq(subscriptions.userId, user.id), isNull(subscriptions.deletedAt)),
    )

  // Parse the results with Zod schemas
  const userSubscriptions = subscriptionsRes.map((row) => ({
    alert: AlertSchema.parse(row.alert),
    channel: row.channel ? ChannelSchema.parse(row.channel) : null,
    subscription: SubscriptionSchema.parse(row.subscription),
  }))

  // Get user's channels for unsubscribe button
  const userChannelsRes = await db
    .select()
    .from(channels)
    .where(and(eq(channels.userId, user.id), isNull(channels.deletedAt)))
  const userChannels = ChannelSchema.array().parse(userChannelsRes)

  return (
    <div className='container mx-auto max-w-6xl'>
      <div className='flex items-center justify-between gap-4 mb-4 sm:mb-6'>
        <div className='flex-1'>
          <h1 className='text-2xl sm:text-3xl font-bold'>Subscriptions</h1>
          <p className='text-muted-foreground mt-1'>
            Alerts you're subscribed to
          </p>
        </div>
        <Link href='/marketplace'>
          <Button>Marketplace</Button>
        </Link>
      </div>

      {userSubscriptions.length === 0 ? (
        <div className='text-center text-muted-foreground py-12 sm:py-16 border rounded-lg'>
          No subscriptions yet. Browse alerts to subscribe to one.
        </div>
      ) : (
        <div className='grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {userSubscriptions.map(({ subscription, alert, channel }) => (
            <ClickableCard
              key={subscription.id}
              href={`/alerts/${alert.id}`}
              lang={alert.languageCode}
              actions={
                <CardActionsPopover>
                  <DropdownMenuItem asChild>
                    <Link href={`/alerts/${alert.id}`}>
                      <ExternalLink className='mr-2 size-4' />
                      View Alert
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <SubscribeAlertDropdownItem
                    alert={alert}
                    channels={userChannels}
                    subscriptions={[subscription]}
                    user={user}
                  />
                </CardActionsPopover>
              }
            >
              <h3 className='font-semibold text-lg line-clamp-1 mb-3'>
                {alert.name}
              </h3>

              <div className='space-y-2 text-sm text-muted-foreground mb-4'>
                <div className='flex justify-between'>
                  <span>Status</span>
                  <span className='text-muted-foreground'>
                    {alert.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span>Language</span>
                  <span className='text-muted-foreground truncate max-w-[150px]'>
                    {LANGUAGE_LABELS[
                      alert.languageCode as keyof typeof LANGUAGE_LABELS
                    ] || alert.languageCode}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span>Channel</span>
                  <div className='flex items-center gap-2'>
                    {channel ? (
                      <>
                        {channel.type === 'email' ? (
                          <Mail className='size-4' />
                        ) : channel.type === 'phone' ? (
                          <Phone className='size-4' />
                        ) : channel.type === 'slack' ? (
                          <Slack className='size-4' />
                        ) : (
                          <MessageSquare className='size-4' />
                        )}
                        <span className='capitalize'>{channel.type}</span>
                      </>
                    ) : (
                      <>
                        <Mail className='size-4' />
                        <span>Email</span>
                      </>
                    )}
                  </div>
                </div>
                <div className='flex justify-between'>
                  <span>Destination</span>
                  <span className='text-muted-foreground truncate max-w-[150px]'>
                    {getChannelDestination(channel, user.email)}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span>Subscribed</span>
                  <span>
                    {subscription.createdAt.toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </ClickableCard>
          ))}
        </div>
      )}
    </div>
  )
}
