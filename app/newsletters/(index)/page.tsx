import { whoami } from '@everynews/auth/session'
import { DeleteNewsletterPopover } from '@everynews/components/delete-newsletter-popover'
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
import { NewsletterSchema, newsletter } from '@everynews/schema/newsletter'
import { eq } from 'drizzle-orm'
import Link from 'next/link'
import { unauthorized } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function NewsPage() {
  const user = await whoami()
  if (!user) return unauthorized()
  const res = await db
    .select()
    .from(newsletter)
    .where(eq(newsletter.userId, user.id))
  const news = NewsletterSchema.array().parse(res)
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {news.map((item) => (
          <TableRow key={item.id}>
            <TableCell className='font-medium'>{item.name}</TableCell>
            <TableCell>
              <Badge variant={item.active ? 'default' : 'outline'}>
                {item.active ? 'Active' : 'Inactive'}
              </Badge>
            </TableCell>
            <TableCell className='flex gap-2'>
              <Link href={`/news/${item.id}`}>
                <Button variant='outline' size='sm'>
                  Edit
                </Button>
              </Link>
              <DeleteNewsletterPopover newsletter={item} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
