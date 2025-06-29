import { cn } from '@everynews/lib/utils'

const Logo = () => (
  <video
    autoPlay
    loop
    muted
    playsInline
    className={cn('size-8')}
  >
    <source src="/logo.webm" type="video/webm" />
  </video>
)

export { Logo }
