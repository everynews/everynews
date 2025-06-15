import { Button } from '@everynews/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@everynews/components/ui/card'
import { ShieldX } from 'lucide-react'
import Link from 'next/link'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <ShieldX className="size-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl">Unauthorized Access</CardTitle>
          <CardDescription>
            You don't have permission to access this resource. Please sign in with the appropriate account.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Button asChild>
            <Link href='/sign-in'>Sign In</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href='/'>Go Home</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}