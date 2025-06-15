import { whoami } from '@everynews/auth/session'
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
import { prompt } from '@everynews/schema'
import { eq } from 'drizzle-orm'
import { PlusCircle, Wrench } from 'lucide-react'
import Link from 'next/link'
import { unauthorized } from 'next/navigation'

export const dynamic = 'force-dynamic'

export const metadata = {
  description: 'Manage your custom AI prompts for alert summarization',
  title: 'Prompts',
}

export default async function PromptsPage() {
  const user = await whoami()
  if (!user) {
    unauthorized()
  }

  const prompts = await db.query.prompt.findMany({
    orderBy: (prompt, { desc }) => [desc(prompt.updatedAt)],
    where: eq(prompt.userId, user.id),
  })

  return (
    <div className='container mx-auto'>
      <div className='flex items-center justify-between gap-4'>
        <div className='flex-1'>
          <h1 className='text-3xl font-bold'>Prompts</h1>
          <p className='text-muted-foreground mt-1'>
            Manage your custom AI prompts for alert summarization
          </p>
        </div>
        <Button asChild>
          <Link href='/my/prompts/create'>
            <PlusCircle className='size-4' />
            Create Prompt
          </Link>
        </Button>
      </div>

      <div className='border rounded-lg mt-6'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className='w-16'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prompts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className='text-center text-muted-foreground py-8'
                >
                  No prompts yet. Create your first custom prompt to get
                  started.
                </TableCell>
              </TableRow>
            ) : (
              prompts.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className='font-medium'>{item.name}</TableCell>
                  <TableCell className='text-muted-foreground'>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className='text-muted-foreground'>
                    {new Date(item.updatedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button asChild variant='ghost'>
                      <Link href={`/my/prompts/${item.id}`}>
                        <Wrench className='size-4' />
                      </Link>
                    </Button>
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
