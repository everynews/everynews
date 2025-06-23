'use client'

import { Button } from '@everynews/components/ui/button'
import { Check, Link } from 'lucide-react'
import { useState } from 'react'

export const CopyMarkdownButton = ({
  title,
  url,
  content,
}: {
  title: string
  url: string
  content: string[]
}) => {
  const [isCopied, setIsCopied] = useState(false)

  const handleCopyMarkdown = () => {
    let markdown = `[${title}](${url})`
    if (content.length > 1) {
      markdown += `\n\n${content.map((c) => `- ${c}`).join('\n')}`
    }
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
      {isCopied ? 'Copied!' : 'Markdown'}
    </Button>
  )
}
