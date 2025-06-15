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
import { Edit, Trash2 } from 'lucide-react'
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
    <div className='container mx-auto'>
      <div className='flex items-center justify-between mb-8'>
        <div>
          <h1 className='text-3xl font-bold'>Channels</h1>
          <p className='text-muted-foreground mt-2'>
            Manage where your newsletters are delivered
          </p>
        </div>
        <ChannelDialog mode='create' />
      </div>

      <div className='border rounded-lg'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className='w-[150px]'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className='font-medium'>
                Default Channel
                <Badge variant='secondary' className='ml-2'>
                  Sign-in Email
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant='outline' className='capitalize'>
                  email
                </Badge>
              </TableCell>
              <TableCell className='text-sm text-muted-foreground'>
                {user.email}
              </TableCell>
              <TableCell>
                <Badge variant='default'>
                  Verified
                </Badge>
              </TableCell>
              <TableCell className='text-muted-foreground'>
                {new Date(user.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <div className='text-sm text-muted-foreground'>
                  Default
                </div>
              </TableCell>
            </TableRow>
            {channelList.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className='text-center text-muted-foreground py-8'
                >
                  You can create additional delivery channels to get your newsletters
                  sent to different destinations.
                </TableCell>
              </TableRow>
            ) : (
              channelList.map((item) => (
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
                  <TableCell className='text-muted-foreground'>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className='flex items-center gap-2'>
                      <ChannelDialog
                        mode='edit'
                        original={item}
                        trigger={
                          <Button size='sm' variant='ghost'>
                            <Edit className='size-4' />
                          </Button>
                        }
                      />
                      {!item.verified && (
                        <SendVerificationButton channel={item} />
                      )}
                      <DeleteChannelPopover
                        channel={item}
                        trigger={
                          <Button size='sm' variant='ghost'>
                            <Trash2 className='size-4' />
                          </Button>
                        }
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
