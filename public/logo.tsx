'use client'

import { cn } from '@everynews/lib/utils'
import Image from 'next/image'
import { useEffect, useState } from 'react'

const Logo = () => {
  const [isSafari, setIsSafari] = useState(false)

  useEffect(() => {
    const userAgent = navigator.userAgent
    const isSafariBrowser = /^((?!chrome|android).)*safari/i.test(userAgent)
    setIsSafari(isSafariBrowser)
  }, [])

  if (isSafari) {
    return (
      <Image
        src="/logo.png"
        alt="Logo"
        width={32}
        height={32}
        className={cn('size-8')}
      />
    )
  }

  return (
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
}

export { Logo }
