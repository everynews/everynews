'use client'

import { DiscordIcon } from '@everynews/components/discord-icon'
import { Button } from '@everynews/components/ui/button'
import { useRouter } from 'next/navigation'

export const DiscordConnectButton = () => {
  const _router = useRouter()

  const handleConnect = () => {
    // Redirect to Discord OAuth flow
    window.location.href = '/api/discord/install'
  }

  return (
    <Button
      onClick={handleConnect}
      variant='outline'
      className='flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-center'
    >
      <DiscordIcon className='size-3 sm:size-4' />
      Connect Discord Server
    </Button>
  )
}
