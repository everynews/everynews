import { Skeleton } from '@everynews/ui/skeleton'

export default function UnsubscribeLoading() {
  return (
    <div className='container mx-auto px-4 py-8 max-w-md'>
      <div className='text-center space-y-4'>
        <Skeleton className='h-8 w-48 mx-auto' />
        <Skeleton className='h-20 w-full' />
        <Skeleton className='h-10 w-full' />
        <Skeleton className='h-10 w-full' />
      </div>
    </div>
  )
}
