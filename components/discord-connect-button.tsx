'use client'

import { SubmitButton } from '@everynews/components/submit-button'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export const DiscordConnectButton = () => {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  
  const handleClick = () => {
    setIsLoading(true)
    router.push('/api/discord/install')
  }
  
  return (
    <SubmitButton
      onClick={handleClick}
      loading={isLoading}
    >
      Connect Discord
    </SubmitButton>
  )
}
