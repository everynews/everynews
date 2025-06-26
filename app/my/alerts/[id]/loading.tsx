import { Button } from '@everynews/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@everynews/components/ui/card'
import { Skeleton } from '@everynews/components/ui/skeleton'

export default function Loading() {
  return (
    <div className='container mx-auto'>
      <div className='mb-6'>
        <h1 className='text-3xl font-bold flex items-center gap-2 justify-between'>
          Edit Alert
          <div className='flex gap-2'>
            <Button variant='outline' disabled>
              Test
            </Button>
            <Button disabled>Update</Button>
          </div>
        </h1>
        <p className='text-muted-foreground mt-1'>
          Update your alert configuration
        </p>
      </div>
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <div className='flex flex-col gap-6'>
          {/* Name field */}
          <div>
            <Skeleton className='h-4 w-12 mb-2' />
            <Skeleton className='h-10 w-full' />
          </div>

          {/* Description field */}
          <div>
            <Skeleton className='h-4 w-20 mb-2' />
            <Skeleton className='h-24 w-full' />
          </div>

          {/* Language field */}
          <div>
            <Skeleton className='h-4 w-16 mb-2' />
            <Skeleton className='h-10 w-full' />
          </div>

          {/* Prompt field */}
          <div>
            <Skeleton className='h-4 w-12 mb-2' />
            <div className='flex gap-2'>
              <Skeleton className='h-10 flex-1' />
              <Skeleton className='h-10 w-32' />
            </div>
          </div>

          {/* Threshold slider */}
          <div>
            <Skeleton className='h-4 w-40 mb-2' />
            <Skeleton className='h-10 w-full' />
          </div>

          <Skeleton className='h-px w-full' />

          {/* News Source */}
          <div>
            <Skeleton className='h-4 w-20 mb-2' />
            <div className='gap-2 xl:grid xl:grid-cols-2'>
              <Skeleton className='h-32 w-full' />
              <Skeleton className='h-32 w-full' />
            </div>
          </div>

          <Skeleton className='h-px w-full' />

          {/* Update Frequency */}
          <div>
            <Skeleton className='h-4 w-24 mb-2' />
            <div className='gap-2 lg:grid lg:grid-cols-2'>
              <Skeleton className='h-24 w-full' />
              <Skeleton className='h-24 w-full' />
            </div>
          </div>

          <Skeleton className='h-px w-full' />

          {/* Active/Public toggles */}
          <div className='space-y-4'>
            <Skeleton className='h-24 w-full' />
            <Skeleton className='h-24 w-full' />
          </div>

          {/* Action buttons */}
          <div className='flex justify-between gap-2'>
            <Button variant='destructive' disabled>
              Cancel
            </Button>
            <div className='flex gap-2'>
              <Button variant='outline' disabled>
                Test
              </Button>
              <Button disabled>Update</Button>
            </div>
          </div>
        </div>

        <div className='space-y-4'>
          <Card className='min-h-64'>
            <CardHeader>
              <CardTitle>
                <Skeleton className='h-6 w-32' />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='flex flex-col gap-4'>
                <Skeleton className='h-4 w-48' />
                <Skeleton className='h-4 w-full' />
                <Skeleton className='h-4 w-3/4' />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
