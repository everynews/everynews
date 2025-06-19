'use client'

import { Button } from '@everynews/components/ui/button'
import { Check, Link } from 'lucide-react'
import { useState } from 'react'

export const CopyMarkdownButton = ({
  title,
  url,
}: {
  title: string
  url: string
}) => {
  const [isCopied, setIsCopied] = useState(false)

  const handleCopyMarkdown = () => {
    const markdown = `[${title}](${url})`
    navigator.clipboard.writeText(markdown)
    setIsCopied(true)
    setTimeout(() => {
      setIsCopied(false)
    }, 2000)
  }

  return (
    <Button
      onClick={handleCopyMarkdown}
      className='flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground'
      variant='outline'
    >
      {isCopied ? <Check className='size-4' /> : <Link className='size-4' />}
      {isCopied ? 'Copied!' : 'Copy as Markdown'}
    </Button>
  )
}
