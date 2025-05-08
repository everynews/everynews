import { api } from '@everynews/app/api'
import { Badge } from '@everynews/components/ui/badge'
import { Button } from '@everynews/components/ui/button'
import { PageHeader } from '@everynews/components/ui/page-header'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@everynews/components/ui/table'
import { News, newsArraySchema } from '@everynews/drizzle/types'
import { Edit, PlusCircle, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

export default async function NewsPage() {
  const response = await api.news.$get()
  const data = await response.json()
  const newsItems: News[] = newsArraySchema.parse(
    'news' in data ? data.news : data,
  )

  return (
    <div className='w-full'>
      <PageHeader
        title='News Management'
        description='Create and manage your news sources and tracking'
        actions={
          <Link href='/news/create'>
            <Button>
              <PlusCircle className='mr-2 h-4 w-4' />
              Create News Item
            </Button>
          </Link>
        }
      />

      <Suspense fallback={'Loading...'}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Run</TableHead>
              <TableHead>Next Run</TableHead>
              <TableHead className='text-right'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {newsItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell className='font-medium'>{item.name}</TableCell>
                <TableCell>
                  <div className='flex items-center space-x-2'>
                    <Badge variant={item.isActive ? 'default' : 'outline'}>
                      {item.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  {item.lastRun
                    ? new Date(item.lastRun).toLocaleString()
                    : 'Never'}
                </TableCell>
                <TableCell>
                  {item.nextRun
                    ? new Date(item.nextRun).toLocaleString()
                    : 'Not scheduled'}
                </TableCell>
                <TableCell className='text-right'>
                  <div className='flex justify-end gap-2'>
                    <Link href={`/news/edit/${item.id}`}>
                      <Button size='sm' variant='outline'>
                        <Edit className='h-4 w-4' />
                      </Button>
                    </Link>
                    <Button
                      size='sm'
                      variant='outline'
                      className='text-destructive'
                      disabled={true}
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Suspense>
    </div>
  )
}
