import { whoami } from '@everynews/auth/session'
import { ClickableCard } from '@everynews/components/clickable-card'
import { DeleteChannelPopover } from '@everynews/components/delete-channel-popover'
import { SendVerificationButton } from '@everynews/components/send-verification-button'
import { Badge } from '@everynews/components/ui/badge'
import { Button } from '@everynews/components/ui/button'
import { db } from '@everynews/database'
import { ChannelSchema, channels } from '@everynews/schema/channel'
import { and, eq, isNull } from 'drizzle-orm'
import { Mail, Phone, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { unauthorized } from 'next/navigation'

export const metadata = {
  description: 'Manage where your alerts are delivered.',
  title: 'Channels',
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
    <div className='container mx-auto max-w-6xl px-4 sm:px-6'>
      <div className='flex items-center justify-between gap-4 mb-6'>
        <div className='flex-1'>
          <h1 className='text-3xl font-bold'>Channels</h1>
          <p className='text-muted-foreground mt-1'>
            Manage where your alerts are delivered
          </p>
        </div>
        <Button asChild>
          <Link href='/my/channels/create'>Create Channel</Link>
        </Button>
      </div>

      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {/* Default channel card */}
        <div className='border rounded-lg p-4 bg-card'>
          <h3 className='font-semibold text-lg mb-3'>Default Channel</h3>

          <div className='space-y-2 text-sm text-muted-foreground mb-4'>
            <div className='flex justify-between'>
              <span>Status</span>
              <span className='text-muted-foreground'>Verified</span>
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
              <span className='text-muted-foreground truncate max-w-[150px]'>
                {user.email}
              </span>
            </div>
            <div className='flex justify-between'>
              <span>Created</span>
              <span>{new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          <div className='flex items-center justify-center'>
            <Badge variant='secondary'>Sign-in Email</Badge>
          </div>
        </div>

        {/* User-created channels */}
        {channelList.map((item) => (
          <ClickableCard
            key={item.id}
            href={`/my/channels/${item.id}`}
            actions={
              <div className='flex items-center justify-between'>
                <DeleteChannelPopover channel={item}>
                  <Button size='icon' variant='destructive'>
                    <Trash2 className='size-4' />
                  </Button>
                </DeleteChannelPopover>
                <div className='flex items-center gap-2'>
                  {!item.verified && <SendVerificationButton channel={item} />}
                </div>
              </div>
            }
          >
            <h3 className='font-semibold text-lg line-clamp-1 mb-3'>
              {item.name}
            </h3>

            <div className='space-y-2 text-sm text-muted-foreground mb-4'>
              <div className='flex justify-between'>
                <span>Status</span>
                <span className='text-muted-foreground'>
                  {item.verified ? 'Verified' : 'Pending'}
                </span>
              </div>
              <div className='flex justify-between'>
                <span>Type</span>
                <div className='flex items-center gap-2'>
                  {item.type === 'email' ? (
                    <Mail className='size-4' />
                  ) : item.type === 'phone' ? (
                    <Phone className='size-4' />
                  ) : null}
                  <span className='capitalize'>{item.type}</span>
                </div>
              </div>
              <div className='flex justify-between'>
                <span>Destination</span>
                <span className='text-muted-foreground truncate max-w-[150px]'>
                  {item.config.destination}
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
