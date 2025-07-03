'use client'

import { SubmitButton } from '@everynews/components/submit-button'
import { useState } from 'react'

export const DiscordConnectButton = () => {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = () => {
    setIsLoading(true)
    if (typeof window !== 'undefined') {
      window.location.href = '/api/discord/install'
    }
  }

  return (
    <SubmitButton onClick={handleClick} loading={isLoading}>
      Connect Discord
    </SubmitButton>
  )
}
