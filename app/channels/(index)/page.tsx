import { whoami } from '@everynews/auth/session'
import { DeleteChannelPopover } from '@everynews/components/delete-channel-popover'
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
import { db } from '@everynews/drizzle'
import { ChannelSchema, channels } from '@everynews/schema/channel'
import { eq } from 'drizzle-orm'
import Link from 'next/link'
import { unauthorized } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function ChannelsPage() {
  const user = await whoami()
  if (!user) return unauthorized()
  const res = await db
    .select()
    .from(channels)
    .where(eq(channels.userId, user.id))
  const channelList = ChannelSchema.array().parse(res)
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Destination</TableHead>
          <TableHead>Actions</TableHead>
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
            <TableCell className='flex gap-2'>
              <Link href={`/channels/${item.id}`}>
                <Button variant='outline' size='sm'>
                  Edit
                </Button>
              </Link>
              <DeleteChannelPopover channel={item} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
