'use client'

import { auth } from '@everynews/auth/client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function SignOutPage() {
  const router = useRouter()

  useEffect(() => {
    const signOut = async () => {
      await auth.signOut()
      router.push('/')
    }
    signOut()
  }, [router])

  return (
    <div className='flex items-center justify-center bg-background p-4 my-10'>
      <p className='text-muted-foreground'>Signing out...</p>
    </div>
  )
}
