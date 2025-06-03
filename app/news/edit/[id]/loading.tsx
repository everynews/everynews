import { Skeleton } from '@everynews/components/ui/skeleton'

export default function Loading() {
  return (
    <div className='space-y-6 p-4'>
      <div className='space-y-4'>
        <Skeleton className='h-10 w-full' />
        <Skeleton className='h-32 w-full' />
        <div className='flex space-x-2'>
          <Skeleton className='h-10 w-24' />
          <Skeleton className='h-10 w-24' />
        </div>
      </div>
    </div>
  )
}
