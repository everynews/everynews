import { getUser } from '@everynews/auth/session'
import { ResendVerificationButton } from '@everynews/components/email-verification-required/resend-verification-button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@everynews/components/ui/card'
import { Mail, ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function EmailVerificationRequiredPage() {
  const user = await getUser()

  if (!user) {
    redirect('/sign-in')
  }

  if (user.emailVerified) {
    redirect('/')
  }

  return (
    <div className='flex items-center justify-center bg-background p-4 my-10'>
      <Card className='w-full max-w-md'>
        <CardHeader className='text-center'>
          <div className='mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900'>
            <ShieldAlert className='size-6 text-orange-600 dark:text-orange-400' />
          </div>
          <CardTitle>Email Verification Required</CardTitle>
          <CardDescription>
            Please verify your email address to access this page
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-center justify-center gap-2 rounded-lg bg-muted p-3'>
            <Mail className='size-4 text-muted-foreground' />
            <span className='text-sm font-medium'>{user.email}</span>
          </div>
          <p className='text-sm text-center text-muted-foreground'>
            We've sent you an email with a verification link. Please check your
            inbox and click the link to verify your email address.
          </p>
          <ResendVerificationButton email={user.email} />
        </CardContent>
        <CardFooter className='flex flex-col gap-2'>
          <Link
            href='/settings/profile'
            className='text-sm text-muted-foreground hover:text-foreground'
          >
            Update email address
          </Link>
          <Link
            href='/sign-out'
            className='text-sm text-muted-foreground hover:text-foreground'
          >
            Sign out
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
