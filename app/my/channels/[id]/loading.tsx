import { Button } from '@everynews/components/ui/button'
import { Skeleton } from '@everynews/components/ui/skeleton'

export default function Loading() {
  return (
    <>
      <div className='mb-4 sm:mb-6'>
        <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2'>
          <div>
            <h1 className='text-2xl sm:text-3xl font-bold'>Edit Channel</h1>
            <p className='text-muted-foreground mt-1'>
              Update your delivery channel settings
            </p>
          </div>
          <Skeleton className='h-6 w-20' />
        </div>
      </div>

      <div className='flex flex-col gap-4 sm:gap-6'>
        {/* Name field */}
        <div>
          <Skeleton className='h-4 w-12 mb-2' />
          <Skeleton className='h-10 w-full' />
        </div>

        <Skeleton className='h-px w-full' />

        {/* Email field */}
        <div>
          <Skeleton className='h-4 w-24 mb-2' />
          <Skeleton className='h-10 w-full' />
        </div>

        <div className='flex justify-end gap-2'>
          <Button variant='outline' disabled>
            Cancel
          </Button>
          <Button disabled>Update</Button>
        </div>
      </div>
    </>
  )
}
