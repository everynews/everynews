import { Button } from '@everynews/components/ui/button'
import { PageHeader } from '@everynews/components/ui/page-header'
import { PlusCircle } from 'lucide-react'
import Link from 'next/link'

const NewsLayout = ({ children }: { children: React.ReactNode }) => (
  <>
    <PageHeader
      title='News'
      actions={
        <Link href='/news/create'>
          <Button className='flex gap-1'>
            <PlusCircle className='size-4' />
            Create
          </Button>
        </Link>
      }
    />
    <main>{children}</main>
  </>
)

export default NewsLayout
