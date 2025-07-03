'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { SubmitButton } from './submit-button'

export const SlackConnectButton = () => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleConnect = () => {
    setIsLoading(true)  
    router.push('/api/slack/install')
  }

  return (
    <SubmitButton
      onClick={handleConnect}
      loading={isLoading}
    >
      Connect Slack
    </SubmitButton>
  )
}
