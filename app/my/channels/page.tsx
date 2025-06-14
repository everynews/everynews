import { whoami } from '@everynews/auth/session'
import { ChannelDialog } from '@everynews/components/channel-dialog'
import { DeleteChannelPopover } from '@everynews/components/delete-channel-popover'
import { SendVerificationButton } from '@everynews/components/send-verification-button'
import { Badge } from '@everynews/components/ui/badge'
import { Button } from '@everynews/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@everynews/components/ui/table'
import { db } from '@everynews/database'
import { ChannelSchema, channels } from '@everynews/schema/channel'
import { eq } from 'drizzle-orm'
import { Edit } from 'lucide-react'
import { unauthorized } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function MyChannelsPage() {
  const user = await whoami()
  if (!user) return unauthorized()

  const res = await db
    .select()
    .from(channels)
    .where(eq(channels.userId, user.id))
  const channelList = ChannelSchema.array().parse(res)

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex justify-between items-center px-3'>
        <div>
          <h2 className='text-2xl font-bold'>My Channels</h2>
          <p className='text-muted-foreground'>
            Where should we send your newsletters?
          </p>
        </div>
        <ChannelDialog mode='create' />
      </div>

      {channelList.length === 0 ? (
        <div className='text-center py-12'>
          <p className='text-muted-foreground mb-4'>
            You haven't created any channels yet.
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className='text-right'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {channelList.map((item) => (
              <TableRow key={item.id}>
                <TableCell className='font-medium'>{item.name}</TableCell>
                <TableCell>
                  <Badge variant='outline' className='capitalize'>
                    {item.type}
                  </Badge>
                </TableCell>
                <TableCell className='text-sm text-muted-foreground'>
                  {item.config.destination}
                </TableCell>
                <TableCell>
                  <Badge variant={item.verified ? 'default' : 'destructive'}>
                    {item.verified ? 'Verified' : 'Pending'}
                  </Badge>
                </TableCell>
                <TableCell className='flex gap-2 justify-end'>
                  <ChannelDialog
                    mode='edit'
                    original={item}
                    trigger={
                      <Button variant='outline' size='sm'>
                        <Edit className='size-4 mr-1' />
                        Edit
                      </Button>
                    }
                  />
                  {!item.verified && <SendVerificationButton channel={item} />}
                  <DeleteChannelPopover channel={item} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
