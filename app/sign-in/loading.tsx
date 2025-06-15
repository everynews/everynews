import { Button } from '@everynews/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@everynews/components/ui/card'
import { Input } from '@everynews/components/ui/input'
import Link from 'next/link'

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center bg-background p-4 my-10">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Welcome to every.news</CardTitle>
          <CardDescription>
            By logging in, you agree to our{' '}
            <Link href='/terms' className='text-blue-500'>
              terms of service
           p </Link>
            .
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <Input
              type='email'
              placeholder='elon@x.com'
              required
            />
          </form>
        </CardContent>
        <CardFooter className='flex justify-end'>
          <Button className="w-full" disabled={true}>
            Sign In
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}