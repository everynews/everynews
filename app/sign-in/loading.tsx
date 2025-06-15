import { Button } from '@everynews/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@everynews/components/ui/card'
import { Input } from '@everynews/components/ui/input'
import MetaKeyIcon from '@everynews/lib/meta-key'
import { CornerDownLeft } from 'lucide-react'
import Link from 'next/link'

export default function SignInPage() {
  return (
    <div className='flex items-center justify-center bg-background p-4 my-10'>
      <Card className='w-full max-w-md'>
        <CardHeader className='text-center'>
          <CardTitle>Welcome to every.news</CardTitle>
          <CardDescription>
            By logging in, you agree to our{' '}
            <Link href='/terms' className='text-blue-500'>
              terms of service
            </Link>
            .
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input type='email' placeholder='elon@x.com' disabled />
        </CardContent>
        <CardFooter className='flex justify-end gap-2'>
          <Button variant='outline' disabled>
            Sign In
          </Button>
          <Button disabled>
            <div className='flex items-center gap-1'>
              I&apos;m feeling lucky
              <span className='flex items-center'>
                <MetaKeyIcon className='size-3' />
                <CornerDownLeft className='size-3' />
              </span>
            </div>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
