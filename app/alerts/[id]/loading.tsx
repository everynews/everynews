import { Badge } from '@everynews/components/ui/badge'
import { Button } from '@everynews/components/ui/button'
import { Card, CardContent, CardHeader } from '@everynews/components/ui/card'
import { Skeleton } from '@everynews/components/ui/skeleton'

export default function Loading() {
  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-col text-center gap-2'>
        <div className='flex flex-col items-center justify-center gap-4'>
          <Skeleton className='h-8 w-64' />
          <div className='flex items-center justify-center gap-2'>
            <Button size='sm' disabled>
              Subscribe
            </Button>
            <Button size='sm' variant='outline' disabled>
              Edit
            </Button>
          </div>
        </div>
        <Skeleton className='h-5 w-96 mx-auto' />
      </div>

      <div className='container mx-auto max-w-prose p-4 flex flex-col gap-6'>
        <div className='grid gap-4'>
          {Array.from({ length: 3 }, (_, i) => `card-${i}`).map((key) => (
            <Card key={key}>
              <CardHeader className='pb-3'>
                <Skeleton className='h-4 w-32 mb-2' />
                <Skeleton className='h-6 w-full' />
                <Skeleton className='h-6 w-3/4' />
              </CardHeader>
              <CardContent className='pt-0'>
                <div className='space-y-2'>
                  {Array.from({ length: 3 }, (_, j) => ({
                    index: j + 1,
                    key: `item-${j}`,
                  })).map(({ key, index }) => (
                    <div key={key} className='flex items-center gap-2'>
                      <Badge
                        variant='outline'
                        className='text-xs px-1.5 py-0.5 flex-shrink-0'
                      >
                        {index}
                      </Badge>
                      <Skeleton className='h-4 w-full' />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className='flex justify-center gap-2'>
          <div className='flex items-center gap-2'>
            {Array.from({ length: 5 }, (_, i) => ({
              key: `page-${i}`,
              label: i + 1,
            })).map(({ key, label }) => (
              <Button key={key} variant='outline' size='sm' disabled>
                {label}
              </Button>
            ))}
          </div>
          <Button variant='outline' disabled>
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
