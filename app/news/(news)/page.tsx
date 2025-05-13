import { api } from '@everynews/app/api'
import { Badge } from '@everynews/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@everynews/components/ui/table'
import { NewsSchema } from '@everynews/schema/news'

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
  if (!res.ok) {
    const data: { error: string } = await res.json()
    throw new Error(data.error)
  }
  const news = NewsSchema.array().parse(await res.json())
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Status</TableHead>
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
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
