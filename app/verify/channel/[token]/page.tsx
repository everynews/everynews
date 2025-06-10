import { api } from '@everynews/app/api'
import { Button } from '@everynews/components/ui/button'
import { CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'

export default async function VerifyChannelPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  let success = false
  let channelName = ''
  let error = ''

  try {
    const res = await api.channels.verify[':token'].$get({
      param: { token },
    })

    const data = await res.json()

    if ('error' in data || !data.success) {
      error = 'error' in data ? data.error : 'Verification failed'
    } else {
      success = true
      channelName = data.channelName
    }
  } catch (e) {
    error = JSON.stringify(e)
  }

  return (
    <div className='flex flex-col items-center justify-center min-h-[400px] p-8'>
      <div className='text-center space-y-6 max-w-md'>
        {success ? (
          <>
            <CheckCircle className='mx-auto h-16 w-16 text-green-700 dark:text-green-400' />
            <h1 className='text-2xl font-bold text-green-700 dark:text-green-400'>
              Channel Verified Successfully!
            </h1>
            <p className='text-muted-foreground'>
              Your channel "{channelName}" has been verified and is now ready to
              receive newsletters.
            </p>
            <Link href='/my/channels'>
              <Button className='mt-4'>View Your Channels</Button>
            </Link>
          </>
        ) : (
          <>
            <XCircle className='mx-auto h-16 w-16 text-red-700 dark:text-red-400' />
            <h1 className='text-2xl font-bold text-red-700 dark:text-red-400'>
              {error}
            </h1>
            <p className='text-sm text-muted-foreground'>
              You can resend the verification email from your channels page.
            </p>
            <div className='space-y-2'>
              <Link href='/my/channels'>
                <Button variant='outline'>Go to Channels</Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}