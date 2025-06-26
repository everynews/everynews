import { Button } from '@everynews/components/ui/button'
import { Card, CardContent } from '@everynews/components/ui/card'
import { Skeleton } from '@everynews/components/ui/skeleton'
import { Trash2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className='container mx-auto max-w-6xl px-4 sm:px-6'>
      <div className='flex items-center justify-between gap-4 mb-6'>
        <div className='flex-1'>
          <h1 className='text-3xl font-bold'>Prompts</h1>
          <p className='text-muted-foreground mt-1'>
            Manage your custom AI prompts for alert summarization
          </p>
        </div>
        <Button disabled>Create Prompt</Button>
      </div>

      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className='overflow-hidden'>
            <CardContent className='p-6'>
              <Skeleton className='h-6 w-3/4 mb-3' />

              <div className='space-y-2 text-sm text-muted-foreground mb-4'>
                <div className='flex justify-between'>
                  <span>Created</span>
                  <Skeleton className='h-4 w-20' />
                </div>
                <div className='flex justify-between'>
                  <span>Updated</span>
                  <Skeleton className='h-4 w-20' />
                </div>
              </div>

              <div className='flex items-center justify-start'>
                <Button size='icon' variant='destructive' disabled>
                  <Trash2 className='size-4' />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
