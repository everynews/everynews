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
          <Button>
            <PlusCircle className='mr-2 h-4 w-4' />
            Create News Item
          </Button>
        </Link>
      }
    />
    <main className='p-4'>{children}</main>
  </>
)

export default NewsLayout
