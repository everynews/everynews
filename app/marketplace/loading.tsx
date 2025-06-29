import { Card } from '@everynews/components/ui/card'
import { Skeleton } from '@everynews/components/ui/skeleton'

export default function Loading() {
  return (
    <div className='container mx-auto p-4'>
      <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
        {Array.from({ length: 30 }, (_, i) => `alert-${i}`).map((key) => (
          <Card key={key} className='overflow-hidden'>
            <Skeleton className='h-48 w-full' />
          </Card>
        ))}
      </div>
    </div>
  )
}
