import { Button } from '@everynews/components/ui/button'
import { Skeleton } from '@everynews/components/ui/skeleton'

export default function Loading() {
  return (
    <div className='container mx-auto'>
      <div className='mb-6'>
        <Skeleton className='h-9 w-64 mb-2' />
        <Skeleton className='h-5 w-96' />
      </div>

      <div className='space-y-6'>
        <div className='space-y-2'>
          <Skeleton className='h-4 w-12' />
          <Skeleton className='h-10 w-full' />
        </div>

        <div className='space-y-2'>
          <Skeleton className='h-4 w-20' />
          <Skeleton className='h-96 w-full' />
        </div>

        <div className='flex flex-row items-center gap-1 justify-between'>
          <Button variant='destructive' disabled>
            Delete
          </Button>
          <div className='flex flex-row items-center gap-1'>
            <Button variant='outline' disabled>
              Cancel
            </Button>
            <Button disabled>Save</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
