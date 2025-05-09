import { api } from '@everynews/app/api'
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
import { newsArraySchema } from '@everynews/drizzle/types'
import { Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

export default async function NewsPage() {
  const res = await api.news.$get()
  const { data, error } = await res.json()

  if (error) {
    return <div>Error: {error}</div>
  }

  const news = newsArraySchema.parse(data)

  return (
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
          {news.map((item) => (
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
  )
}
