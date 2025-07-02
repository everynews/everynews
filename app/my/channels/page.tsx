import { whoami } from '@everynews/auth/session'
import {
  CardActionsPopover,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@everynews/components/card-actions-popover'
import { ChannelStatusBadge } from '@everynews/components/channel-status-badge'
import { ClickableCard } from '@everynews/components/clickable-card'
import { DeleteChannelDropdownItem } from '@everynews/components/delete-channel-dropdown-item'
import { SendVerificationDropdownItem } from '@everynews/components/send-verification-dropdown-item'
import { Button } from '@everynews/components/ui/button'
import { db } from '@everynews/database'
import {
  ChannelSchema,
  channels,
  SlackChannelConfigSchema,
} from '@everynews/schema/channel'
import { and, eq, isNull } from 'drizzle-orm'
import { CheckCircle, Edit, Mail, Phone, Slack } from 'lucide-react'
import Link from 'next/link'
import { unauthorized } from 'next/navigation'
import { z } from 'zod'

export const metadata = {
  description: 'Manage where your alerts are delivered.',
  title: 'Channels',
}

const getChannelDestination = (item: z.infer<typeof ChannelSchema>) => {
  if (item.type === 'slack') {
    const config = SlackChannelConfigSchema.safeParse(item.config)
    if (config.success && config.data.channel) {
      return `#${config.data.channel.name}`
    }
    return 'Not selected'
  } else if (item.type === 'email' || item.type === 'phone') {
    const config = z.object({ destination: z.string() }).safeParse(item.config)
    return config.success ? config.data.destination : 'N/A'
  }
  return 'N/A'
}

export default async function MyChannelsPage() {
  const user = await whoami()
  if (!user) return unauthorized()

  const res = await db
    .select()
    .from(channels)
    .where(and(eq(channels.userId, user.id), isNull(channels.deletedAt)))
  const channelList = ChannelSchema.array().parse(res)

  return (
    <div className='container mx-auto max-w-6xl'>
      <div className='flex items-center justify-between gap-4 mb-4 sm:mb-6'>
        <div className='flex-1'>
          <h1 className='text-2xl sm:text-3xl font-bold'>Channels</h1>
          <p className='text-muted-foreground mt-1'>
            Manage where your alerts are delivered
          </p>
        </div>
        <Button asChild>
          <Link href='/my/channels/create'>Create Channel</Link>
        </Button>
      </div>

      <div className='grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {/* Primary channel card */}
        <div className='border rounded-lg p-3 sm:p-4 bg-card shadow-sm'>
          <h3 className='font-semibold text-base sm:text-lg mb-2 sm:mb-3'>
            Sign-in Email
          </h3>

          <div className='space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4'>
            <div className='flex justify-between'>
              <span>Status</span>
              <div className='flex items-center gap-1'>
                <CheckCircle className='size-3' />
                <span className='text-muted-foreground'>Verified</span>
              </div>
            </div>
            <div className='flex justify-between'>
              <span>Type</span>
              <div className='flex items-center gap-2'>
                <Mail className='size-4' />
                <span className='capitalize'>email</span>
              </div>
            </div>
            <div className='flex justify-between'>
              <span>Destination</span>
              <span className='text-muted-foreground truncate max-w-[120px] sm:max-w-[150px]'>
                {user.email}
              </span>
            </div>
            <div className='flex justify-between'>
              <span>Created</span>
              <span>{new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* User-created channels */}
        {channelList.map((item) => (
          <ClickableCard
            key={item.id}
            href={`/my/channels/${item.id}`}
            actions={
              <CardActionsPopover>
                <DropdownMenuItem asChild>
                  <Link href={`/my/channels/${item.id}`}>
                    <Edit className='mr-2 size-4' />
                    Edit
                  </Link>
                </DropdownMenuItem>
                {!item.verified && item.type !== 'slack' && (
                  <>
                    <DropdownMenuSeparator />
                    <SendVerificationDropdownItem channel={item} />
                  </>
                )}
                <DropdownMenuSeparator />
                <DeleteChannelDropdownItem channel={item} />
              </CardActionsPopover>
            }
          >
            <h3 className='font-semibold text-base sm:text-lg line-clamp-1 mb-2 sm:mb-3'>
              {item.name}
            </h3>

            <div className='space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4'>
              <div className='flex justify-between items-center'>
                <span>Status</span>
                <ChannelStatusBadge channel={item} />
              </div>
              <div className='flex justify-between'>
                <span>Type</span>
                <div className='flex items-center gap-2'>
                  {item.type === 'email' ? (
                    <Mail className='size-3 sm:size-4' />
                  ) : item.type === 'phone' ? (
                    <Phone className='size-3 sm:size-4' />
                  ) : item.type === 'slack' ? (
                    <Slack className='size-3 sm:size-4' />
                  ) : null}
                  <span className='capitalize'>
                    {['email', 'phone', 'slack'].includes(item.type)
                      ? item.type
                      : 'unknown channel'}
                  </span>
                </div>
              </div>
              <div className='flex justify-between'>
                <span>Destination</span>
                <span className='text-muted-foreground truncate max-w-[120px] sm:max-w-[150px]'>
                  {getChannelDestination(item)}
                </span>
              </div>
              <div className='flex justify-between'>
                <span>Created</span>
                <span>{new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </ClickableCard>
        ))}
      </div>

      {channelList.length === 0 && (
        <div className='text-center text-muted-foreground mt-8'>
          You can create additional delivery channels to get your alerts sent to
          different destinations.
        </div>
      )}
    </div>
  )
}
