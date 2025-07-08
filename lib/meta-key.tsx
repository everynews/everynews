'use client'

import { ChevronUp, Command } from 'lucide-react'
import { useEffect, useState } from 'react'

const MetaKeyIcon = ({ className }: { className?: string }) => {
  const [isMac, setIsMac] = useState(false)

  useEffect(() => {
    setIsMac(navigator.userAgent.toLowerCase().includes('mac'))
  }, [])

  return (
    <span className={className}>
      {isMac ? (
        <Command className={className} />
      ) : (
        <ChevronUp className={className} />
      )}
    </span>
  )
}

export default MetaKeyIcon
