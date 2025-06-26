import { Badge } from '@everynews/components/ui/badge'
import { Button } from '@everynews/components/ui/button'
import { Card, CardContent } from '@everynews/components/ui/card'
import { Skeleton } from '@everynews/components/ui/skeleton'
import { Calendar, ExternalLink, Globe } from 'lucide-react'

export default function Loading() {
  return (
    <div className='container mx-auto max-w-4xl p-4'>
      <div className='mb-6'>
        <div className='flex flex-col gap-4'>
          <div className='flex items-center gap-2 text-sm text-muted-foreground'>
            <Globe className='size-4' />
            <Skeleton className='h-4 w-24' />
            <span>•</span>
            <Calendar className='size-4' />
            <Skeleton className='h-4 w-40' />
          </div>

          <Skeleton className='h-9 w-full' />
          <Skeleton className='h-9 w-3/4' />
        </div>
      </div>

      <Card>
        <CardContent className='p-4'>
          <div className='flex flex-col gap-2'>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className='flex items-center gap-2'>
                <Badge variant='secondary' className='text-xs px-2 py-1'>
                  {i + 1}
                </Badge>
                <Skeleton className='h-4 flex-1' />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className='pt-6'>
        <div className='flex justify-between items-center'>
          <Button variant='outline' className='text-sm' disabled>
            <ExternalLink className='size-4' />
            Source
          </Button>
          <div className='flex gap-2'>
            <Button variant='outline' size='icon' disabled>
              <Skeleton className='size-4' />
            </Button>
            <Button variant='outline' size='icon' disabled>
              <Skeleton className='size-4' />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
