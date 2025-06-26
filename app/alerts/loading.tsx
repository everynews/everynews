import { Badge } from '@everynews/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@everynews/components/ui/card'
import { Skeleton } from '@everynews/components/ui/skeleton'
import { FileText, Users } from 'lucide-react'

export default function Loading() {
  return (
    <div className='container mx-auto p-4'>
      <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className='h-full'>
            <CardHeader>
              <div className='flex items-start justify-between'>
                <div className='flex-1'>
                  <CardTitle className='text-lg'>
                    <Skeleton className='h-6 w-48' />
                  </CardTitle>
                </div>
                <Badge variant='default'>Active</Badge>
              </div>
            </CardHeader>

            <CardContent>
              <div className='flex flex-col gap-3'>
                <div className='space-y-1'>
                  <Skeleton className='h-4 w-full' />
                  <Skeleton className='h-4 w-3/4' />
                </div>
                <div className='flex items-center justify-between text-sm text-muted-foreground'>
                  <div className='flex items-center gap-2'>
                    <FileText className='size-4' />
                    <Skeleton className='h-4 w-16' />
                  </div>
                  <div className='flex items-center gap-2'>
                    <Users className='size-4' />
                    <Skeleton className='h-4 w-20' />
                  </div>
                </div>
                <Badge
                  variant='outline'
                  className='text-muted-foreground text-xs'
                >
                  <Skeleton className='h-3 w-24' />
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
