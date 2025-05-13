import { cn } from '@everynews/lib/utils'
import favicon from '@everynews/public/favicon.svg'
import Image from 'next/image'

const Logo = () => (
  <Image
    priority
    src={favicon}
    alt='EveryNews'
    width={24}
    height={24}
    className={cn('h-6 w-6')}
  />
)

export { Logo }
