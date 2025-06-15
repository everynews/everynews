import { api } from '@everynews/app/api'
import { Button } from '@everynews/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@everynews/components/ui/card'
import { CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  description: 'Confirm your delivery channel.',
  title: 'Verify Channel',
}

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
    <div className='flex items-center justify-center bg-background p-4 my-10'>
      <Card className='w-full max-w-md'>
        {success ? (
          <>
            <CardHeader className='text-center'>
              <CheckCircle className='mx-auto h-16 w-16 text-green-700 dark:text-green-400 my-2' />
              <CardTitle className='text-green-700 dark:text-green-400'>
                Channel Verified Successfully!
              </CardTitle>
              <CardDescription>
                Your channel "{channelName}" has been verified and is now ready
                to receive alerts.
              </CardDescription>
            </CardHeader>
            <CardContent className='flex justify-center'>
              <Link href='/my/channels'>
                <Button>View Your Channels</Button>
              </Link>
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader className='text-center'>
              <XCircle className='mx-auto h-16 w-16 text-red-700 dark:text-red-400' />
              <CardTitle className='text-red-700 dark:text-red-400'>
                {error}
              </CardTitle>
              <CardDescription>
                You can resend the verification email from your channels page.
              </CardDescription>
            </CardHeader>
            <CardContent className='flex justify-center'>
              <Link href='/my/channels'>
                <Button variant='outline'>Go to Channels</Button>
              </Link>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  )
}
