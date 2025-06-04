'use client'

import { cn } from '@everynews/lib/utils'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'

export const ScalingLoader = ({ loading }: { loading: boolean }) => {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        setShow(true)
      }, 0)
      return () => clearTimeout(timeout)
    } else {
      setShow(false)
    }
  }, [loading])

  return (
    <Loader2
      className={cn(
        'size-0 animate-spin transition-all hidden',
        loading && 'block',
        show && 'size-4',
      )}
    />
  )
}
