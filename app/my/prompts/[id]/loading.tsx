import { Button } from '@everynews/components/ui/button'
import { Skeleton } from '@everynews/components/ui/skeleton'

export default function Loading() {
  return (
    <>
      <div className='mb-4 sm:mb-6'>
        <Skeleton className='h-8 sm:h-9 w-48 sm:w-64 mb-2' />
        <Skeleton className='h-5 w-72 sm:w-96' />
      </div>

      <div className='space-y-4 sm:space-y-6'>
        <div className='space-y-2'>
          <Skeleton className='h-4 w-12' />
          <Skeleton className='h-10 w-full' />
        </div>

        <div className='space-y-2'>
          <Skeleton className='h-4 w-20' />
          <Skeleton className='h-96 w-full' />
        </div>

        <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-2 justify-between'>
          <Button variant='destructive' disabled className='w-full sm:w-auto'>
            Delete
          </Button>
          <div className='flex flex-row items-center gap-1'>
            <Button variant='outline' disabled className='flex-1 sm:flex-none'>
              Cancel
            </Button>
            <Button disabled className='flex-1 sm:flex-none'>
              Save
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
