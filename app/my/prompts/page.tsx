import { guardUser } from '@everynews/auth/session'
import {
  CardActionsPopover,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@everynews/components/card-actions-popover'
import { ClickableCard } from '@everynews/components/clickable-card'
import { DeletePromptDropdownItem } from '@everynews/components/delete-prompt-dropdown-item'
import { Button } from '@everynews/components/ui/button'
import { db } from '@everynews/database'
import { prompt } from '@everynews/schema'
import { and, eq, isNull } from 'drizzle-orm'
import { Edit } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  description: 'Manage your custom AI prompts for alert summarization',
  title: 'Prompts',
}

export default async function PromptsPage() {
  const user = await guardUser()

  const prompts = await db.query.prompt.findMany({
    orderBy: (prompt, { desc }) => [desc(prompt.updatedAt)],
    where: and(eq(prompt.userId, user.id), isNull(prompt.deletedAt)),
  })

  return (
    <div className='container mx-auto max-w-6xl'>
      <div className='flex items-center justify-between gap-4 mb-4 sm:mb-6'>
        <div className='flex-1'>
          <h1 className='text-2xl sm:text-3xl font-bold'>Prompts</h1>
          <p className='text-muted-foreground mt-1'>
            Manage your custom AI prompts for alert summarization
          </p>
        </div>
        <Button asChild>
          <Link href='/my/prompts/create'>Create Prompt</Link>
        </Button>
      </div>

      {prompts.length === 0 ? (
        <div className='text-center text-muted-foreground py-12 sm:py-16 border rounded-lg'>
          No prompts yet. Create your first custom prompt to get started.
        </div>
      ) : (
        <div className='grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {prompts.map((item) => (
            <ClickableCard
              key={item.id}
              href={`/my/prompts/${item.id}`}
              actions={
                <CardActionsPopover>
                  <DropdownMenuItem asChild>
                    <Link href={`/my/prompts/${item.id}`}>
                      <Edit className='mr-2 size-4' />
                      Edit
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DeletePromptDropdownItem prompt={item} />
                </CardActionsPopover>
              }
            >
              <h3 className='font-semibold text-lg mb-3 line-clamp-2'>
                {item.name}
              </h3>

              <div className='space-y-2 text-sm text-muted-foreground mb-4'>
                <div className='flex justify-between'>
                  <span>Created</span>
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
                <div className='flex justify-between'>
                  <span>Updated</span>
                  <span>{new Date(item.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </ClickableCard>
          ))}
        </div>
      )}
    </div>
  )
}
