'use client'

import { api } from '@everynews/app/api'
import { Button } from '@everynews/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@everynews/components/ui/dialog'
import { toastNetworkError } from '@everynews/lib/error'
import type { Alert } from '@everynews/schema/alert'
import type { Channel } from '@everynews/schema/channel'
import {
  DiscordChannelConfigSchema,
  SlackChannelConfigSchema,
} from '@everynews/schema/channel'
import type { Subscription } from '@everynews/schema/subscription'
import { Edit, Mail, MessageSquare, Phone, Plus, Slack, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'
import { DiscordIcon } from './discord-icon'
import { SendTestAlertButton } from './send-test-alert-button'
import { SubscribeAlertDialog } from './subscribe-alert-dialog'

const getChannelIcon = (type: string) => {
  switch (type) {
    case 'email':
      return <Mail className='size-4' />
    case 'phone':
      return <Phone className='size-4' />
    case 'slack':
      return <Slack className='size-4' />
    case 'discord':
      return <DiscordIcon className='size-4' />
    default:
      return <MessageSquare className='size-4' />
  }
}

export const ManageAlertSubscriptions = ({
  alert,
  channels,
  subscriptions,
  user,
  isOwner,
  asDialog = true,
}: {
  alert: Alert
  channels: Channel[]
  subscriptions: Subscription[]
  user?: { id: string; email: string; createdAt: Date }
  isOwner: boolean
  asDialog?: boolean
}) => {
  const [open, setOpen] = useState(false)
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    {},
  )
  const router = useRouter()

  const handleUnsubscribe = async (subscriptionId: string) => {
    setLoadingStates((prev) => ({ ...prev, [subscriptionId]: true }))
    try {
      const response = await api.subscriptions[':id'].$delete({
        param: { id: subscriptionId },
      })

      if (!response.ok) {
        toast.error('Failed to unsubscribe from alert')
        return
      }

      toast.success(`Unsubscribed successfully`)
      router.refresh()
    } catch (error) {
      toastNetworkError(error as Error)
    } finally {
      setLoadingStates((prev) => ({ ...prev, [subscriptionId]: false }))
    }
  }

  // Get channel details for each subscription
  const subscriptionWithChannels = subscriptions.map((sub) => {
    const channel = channels.find((ch) => ch.id === sub.channelId)
    return { channel, subscription: sub }
  })

  // Get channels that are not yet subscribed
  const subscribedChannelIds = new Set(
    subscriptions
      .map((sub) => sub.channelId)
      .filter((id): id is string => id !== null),
  )
  const availableChannels = channels.filter(
    (channel) => !subscribedChannelIds.has(channel.id),
  )

  // Check if default channel (email) is subscribed
  const hasDefaultSubscription = subscriptions.some((sub) => !sub.channelId)

  const content = (
    <>
      <DialogHeader>
        <DialogTitle>Manage Alert</DialogTitle>
        <DialogDescription>
          Manage your subscriptions to "{alert.name}"
        </DialogDescription>
      </DialogHeader>

      <div className='space-y-4'>
        {/* Edit Alert Section (for owners) */}
        {isOwner && (
          <div className='pb-4 border-b'>
            <h3 className='font-medium mb-2'>Alert Settings</h3>
            <Link
              href={`/my/alerts/${alert.id}`}
              onClick={() => setOpen(false)}
            >
              <Button variant='outline' className='w-full justify-start'>
                <Edit className='size-4' />
                Edit Alert Details
              </Button>
            </Link>
          </div>
        )}

        {/* Subscriptions Section */}
        <div>
          <div className='flex items-center justify-between mb-3'>
            <h3 className='font-medium'>Your Subscriptions</h3>
            {(availableChannels.length > 0 ||
              (!hasDefaultSubscription && user)) && (
              <SubscribeAlertDialog
                alert={alert}
                channels={channels}
                user={user}
                subscribedChannelIds={Array.from(subscribedChannelIds)}
                hasDefaultSubscription={hasDefaultSubscription}
              >
                <Button variant='outline' size='sm'>
                  <Plus className='size-4 mr-1' />
                  Add Channel
                </Button>
              </SubscribeAlertDialog>
            )}
          </div>

          {subscriptions.length === 0 ? (
            <div className='text-center py-8 text-muted-foreground'>
              <p className='mb-3'>You're not subscribed to this alert yet.</p>
              {user && (
                <SubscribeAlertDialog
                  alert={alert}
                  channels={channels}
                  user={user}
                  subscribedChannelIds={[]}
                  hasDefaultSubscription={false}
                >
                  <Button>Subscribe Now</Button>
                </SubscribeAlertDialog>
              )}
            </div>
          ) : (
            <div className='space-y-2'>
              {subscriptionWithChannels.map(({ subscription, channel }) => (
                <div
                  key={subscription.id}
                  className='flex items-center justify-between p-3 border rounded-lg'
                >
                  <div className='flex items-center gap-3'>
                    {channel ? (
                      getChannelIcon(channel.type)
                    ) : (
                      <Mail className='size-4' />
                    )}
                    <div>
                      <p className='font-medium'>
                        {channel ? channel.name : 'Default Email'}
                      </p>
                      <p className='text-sm text-muted-foreground'>
                        {channel
                          ? channel.type === 'slack'
                            ? (() => {
                                const parsed =
                                  SlackChannelConfigSchema.safeParse(
                                    channel.config,
                                  )
                                if (parsed.success) {
                                  return `Slack: #${parsed.data.channel?.name || 'Unknown channel'}`
                                }
                                return 'Slack: Not configured'
                              })()
                            : channel.type === 'discord'
                              ? (() => {
                                  const parsed =
                                    DiscordChannelConfigSchema.safeParse(
                                      channel.config,
                                    )
                                  if (parsed.success) {
                                    return `Discord: #${parsed.data.channel?.name || 'Unknown channel'}`
                                  }
                                  return 'Discord: Not configured'
                                })()
                              : (() => {
                                  const parsed = z
                                    .object({ destination: z.string() })
                                    .safeParse(channel.config)
                                  if (parsed.success) {
                                    return `${channel.type}: ${parsed.data.destination}`
                                  }
                                  return `${channel.type}: Not configured`
                                })()
                          : `Email: ${user?.email}`}
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center gap-1'>
                    <SendTestAlertButton
                      alert={alert}
                      subscription={subscription}
                      channel={channel}
                    />
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => handleUnsubscribe(subscription.id)}
                      disabled={loadingStates[subscription.id]}
                    >
                      <X className='size-4' />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )

  if (!asDialog) {
    return content
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant='outline' size='sm'>
          Manage
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-lg'>{content}</DialogContent>
    </Dialog>
  )
}
