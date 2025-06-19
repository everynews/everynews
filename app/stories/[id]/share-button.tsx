'use client'

import { Button } from '@everynews/components/ui/button'
import { Check, Share2 } from 'lucide-react'
import { useState } from 'react'

export const ShareButton = ({ title, url }: { title: string; url: string }) => {
  const [isCopied, setIsCopied] = useState(false)
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title,
        url,
      })
    } else {
      navigator.clipboard.writeText(url)
      setIsCopied(true)
      setTimeout(() => {
        setIsCopied(false)
      }, 2000)
    }
  }

  return (
    <Button
      onClick={handleShare}
      className='flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground'
      variant='outline'
    >
      {isCopied ? <Check className='size-4' /> : <Share2 className='size-4' />}
      {isCopied ? 'Copied!' : 'Share'}
    </Button>
  )
}
