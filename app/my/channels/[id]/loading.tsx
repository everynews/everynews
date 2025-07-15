import { Button } from '@everynews/components/ui/button'
import { Skeleton } from '@everynews/components/ui/skeleton'

export default function Loading() {
  return (
    <>
      <div className='mb-6 md:mb-8'>
        <div className='flex flex-col md:flex-row items-start md:items-center justify-between gap-4'>
          <div>
            <h1 className='text-2xl md:text-3xl font-bold'>Edit Channel</h1>
            <p className='text-muted-foreground mt-1'>
              Update your delivery channel settings
            </p>
          </div>
        </div>
      </div>

      <div className='flex flex-col gap-6 md:gap-8'>
        <div className='space-y-6'>
          <div>
            <Skeleton className='h-10 w-full mb-3' />
            <div className='rounded-lg border bg-muted/50 p-4 md:p-6 space-y-3 md:space-y-4'>
              <div className='flex items-center justify-between gap-4'>
                <Skeleton className='h-4 w-20' />
                <Skeleton className='h-4 w-32' />
              </div>
              <div className='flex items-center justify-between gap-4'>
                <Skeleton className='h-4 w-16' />
                <Skeleton className='h-4 w-24' />
              </div>
            </div>
          </div>
        </div>

        <div className='flex flex-col-reverse md:flex-row justify-end gap-2 pt-4'>
          <Button variant='outline' disabled>
            Cancel
          </Button>
          <Button disabled>Update</Button>
        </div>
      </div>
    </>
  )
}
