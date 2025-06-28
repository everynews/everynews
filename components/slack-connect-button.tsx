'use client'

import { Button } from '@everynews/components/ui/button'
import { Slack } from 'lucide-react'
import { useRouter } from 'next/navigation'

export const SlackConnectButton = () => {
  const router = useRouter()

  const handleConnect = () => {
    // Redirect to Slack OAuth flow
    window.location.href = '/api/slack/install'
  }

  return (
    <Button
      onClick={handleConnect}
      variant='outline'
      className='flex items-center gap-2'
    >
      <Slack className='size-4' />
      Connect Slack Workspace
    </Button>
  )
}
