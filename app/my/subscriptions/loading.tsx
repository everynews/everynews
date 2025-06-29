import { Button } from '@everynews/components/ui/button'
import { Card } from '@everynews/components/ui/card'
import { Skeleton } from '@everynews/components/ui/skeleton'
import Link from 'next/link'

export default function Loading() {
  return (
    <div className='container mx-auto max-w-6xl'>
      <div className='flex items-center justify-between gap-4 mb-4 sm:mb-6'>
        <div className='flex-1'>
          <h1 className='text-2xl sm:text-3xl font-bold'>Subscriptions</h1>
          <p className='text-muted-foreground mt-1'>
            Alerts you're subscribed to
          </p>
        </div>
        <Link href='/marketplace'>
          <Button>Browse Alerts</Button>
        </Link>
      </div>

      <div className='grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {Array.from({ length: 6 }, (_, i) => `subscription-${i}`).map((key) => (
          <Card key={key} className='overflow-hidden'>
            <Skeleton className='h-48 w-full' />
          </Card>
        ))}
      </div>
    </div>
  )
}
