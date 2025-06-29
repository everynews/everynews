import { Button } from '@everynews/components/ui/button'
import { Card, CardContent } from '@everynews/components/ui/card'
import { Skeleton } from '@everynews/components/ui/skeleton'
import { Link, Mail } from 'lucide-react'

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
            <CardContent className='p-4'>
              <Skeleton className='h-6 w-3/4 mb-3' />

              <div className='space-y-2 text-sm text-muted-foreground mb-4'>
                <div className='flex justify-between'>
                  <span>Status</span>
                  <Skeleton className='h-4 w-12' />
                </div>
                <div className='flex justify-between'>
                  <span>Language</span>
                  <Skeleton className='h-4 w-16' />
                </div>
                <div className='flex justify-between'>
                  <span>Channel</span>
                  <div className='flex items-center gap-2'>
                    <Mail className='size-4' />
                    <Skeleton className='h-4 w-12' />
                  </div>
                </div>
                <div className='flex justify-between'>
                  <span>Destination</span>
                  <Skeleton className='h-4 w-32' />
                </div>
                <div className='flex justify-between'>
                  <span>Subscribed</span>
                  <Skeleton className='h-4 w-20' />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
