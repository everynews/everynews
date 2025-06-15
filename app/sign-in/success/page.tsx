'use client'

import { SubmitButton } from '@everynews/components/submit-button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@everynews/components/ui/card'
import MetaKeyIcon from '@everynews/lib/meta-key'
import { CheckCircle, CornerDownLeft, Delete } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'

export default function SignInSuccessPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [loadingButton, setLoadingButton] = useState<
    'home' | 'onboarding' | null
  >(null)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault()
        setLoadingButton('onboarding')
        startTransition(() => {
          router.push('/onboarding')
        })
      }

      if (event.key === 'Backspace') {
        event.preventDefault()
        setLoadingButton('home')
        startTransition(() => {
          router.push('/home')
        })
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [router])

  return (
    <div className='flex items-center justify-center bg-background p-4 my-10'>
      <Card className='w-full max-w-md'>
        <CardHeader className='text-center'>
          <CheckCircle className='mx-auto h-16 w-16 text-green-700 dark:text-green-400 my-2' />
          <CardTitle>Signed In</CardTitle>
          <CardDescription>Now, let&apos;s get you onboarded.</CardDescription>
        </CardHeader>
        <CardContent className='grid grid-cols-2 gap-2'>
          <SubmitButton
            loading={loadingButton === 'home' && isPending}
            onClick={() => {
              setLoadingButton('home')
              startTransition(() => {
                router.push('/home')
              })
            }}
            variant='outline'
            className='w-full'
          >
            <div className='flex items-center gap-1'>
              Bring Me Home
              <Delete className='size-3' />
            </div>
          </SubmitButton>
          <SubmitButton
            loading={loadingButton === 'onboarding' && isPending}
            onClick={() => {
              setLoadingButton('onboarding')
              startTransition(() => {
                router.push('/onboarding')
              })
            }}
            className='w-full'
          >
            <div className='flex items-center gap-1'>
              Onboard Me
              <span className='flex items-center'>
                <MetaKeyIcon className='size-3' />
                <CornerDownLeft className='size-3' />
              </span>
            </div>
          </SubmitButton>
        </CardContent>
      </Card>
    </div>
  )
}
