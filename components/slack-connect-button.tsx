'use client'

import { Button } from '@everynews/components/ui/button'
import { Slack } from 'lucide-react'
import { useRouter } from 'next/navigation'

export const SlackConnectButton = () => {
  const _router = useRouter()

  const handleConnect = () => {
    // Redirect to Slack OAuth flow
    window.location.href = '/api/slack/install'
  }

  return (
    <Button
      onClick={handleConnect}
      variant='outline'
      className='flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-center'
    >
      <Slack className='size-3 sm:size-4' />
      Connect Slack Workspace
    </Button>
  )
}
