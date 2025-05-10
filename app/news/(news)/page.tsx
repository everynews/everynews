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
import { Edit } from 'lucide-react'
import Link from 'next/link'
import { DeleteButton } from './delete-button'

export const dynamic = 'force-dynamic'

/**
 * Displays a table of news items fetched from the API, allowing users to view, edit, or delete each item.
 *
 * Fetches news data asynchronously and renders it in a table with columns for name, status, and actions. Shows an error message if the API request fails.
 *
 * @returns A React element displaying the news list or an error message.
 */
export default async function NewsPage() {
  const res = await api.news.$get()
  const { data, error } = await res.json()

  if (error) {
    return <div>Error: {JSON.stringify(error)}</div>
  }

  const news = data

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
              <div className='flex items-center space-x-2'>
                <Badge variant={item.active ? 'default' : 'outline'}>
                  {item.active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </TableCell>
            <TableCell className='text-right'>
              <div className='flex justify-end gap-2'>
                <Link href={`/news/edit/${item.id}`}>
                  <Button size='sm' variant='outline'>
                    <Edit className='h-4 w-4' />
                  </Button>
                </Link>
                <DeleteButton id={item.id} />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
