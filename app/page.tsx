import { Button } from '@everynews/components/ui/button'
import Link from 'next/link'

const Page = () => (
  <div className='container mx-auto flex h-full flex-col items-center justify-center gap-6 p-4'>
    <h1 className='text-4xl font-bold'>Everynews</h1>
    <p className='text-muted-foreground'>
      Your daily source for news and updates
    </p>
    <div>
      <Link href='/news'>
        <Button>Browse News</Button>
      </Link>
    </div>
  </div>
)

export default Page
