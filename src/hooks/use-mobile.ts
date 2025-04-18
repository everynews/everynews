'use client'

import { useEffect, useState } from 'react'

const MOBILE_BREAKPOINT = 1024

export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState<boolean>(false)

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)

    // Use matches from the media query directly
    const onChange = () => setIsMobile(mql.matches)

    mql.addEventListener('change', onChange)
    // Set initial state based on media query
    setIsMobile(mql.matches)
    return () => mql.removeEventListener('change', onChange)
  }, [])
  return isMobile
}
