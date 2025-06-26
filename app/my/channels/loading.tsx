import { Badge } from '@everynews/components/ui/badge'
import { Button } from '@everynews/components/ui/button'
import { Card, CardContent } from '@everynews/components/ui/card'
import { Skeleton } from '@everynews/components/ui/skeleton'
import { Mail, Trash2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className='container mx-auto max-w-6xl px-4 sm:px-6'>
      <div className='flex items-center justify-between gap-4 mb-6'>
        <div className='flex-1'>
          <h1 className='text-3xl font-bold'>Channels</h1>
          <p className='text-muted-foreground mt-1'>
            Manage where your alerts are delivered
          </p>
        </div>
        <Button disabled>Create Channel</Button>
      </div>

      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {/* Default channel card skeleton */}
        <div className='border rounded-lg p-4 bg-card'>
          <h3 className='font-semibold text-lg mb-3'>Default Channel</h3>

          <div className='space-y-2 text-sm text-muted-foreground mb-4'>
            <div className='flex justify-between'>
              <span>Status</span>
              <span className='text-muted-foreground'>Verified</span>
            </div>
            <div className='flex justify-between'>
              <span>Type</span>
              <div className='flex items-center gap-2'>
                <Mail className='size-4' />
                <span className='capitalize'>email</span>
              </div>
            </div>
            <div className='flex justify-between'>
              <span>Destination</span>
              <Skeleton className='h-4 w-32' />
            </div>
            <div className='flex justify-between'>
              <span>Created</span>
              <Skeleton className='h-4 w-20' />
            </div>
          </div>

          <div className='flex items-center justify-center'>
            <Badge variant='secondary'>Sign-in Email</Badge>
          </div>
        </div>

        {/* User-created channel skeletons */}
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className='overflow-hidden'>
            <CardContent className='p-4'>
              <Skeleton className='h-6 w-3/4 mb-3' />

              <div className='space-y-2 text-sm text-muted-foreground mb-4'>
                <div className='flex justify-between'>
                  <span>Status</span>
                  <Skeleton className='h-4 w-16' />
                </div>
                <div className='flex justify-between'>
                  <span>Type</span>
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
                  <span>Created</span>
                  <Skeleton className='h-4 w-20' />
                </div>
              </div>

              <div className='flex items-center justify-between'>
                <Button size='icon' variant='destructive' disabled>
                  <Trash2 className='size-4' />
                </Button>
                <Button size='sm' disabled>
                  Verify
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
