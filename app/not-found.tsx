import { Button } from '@everynews/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@everynews/components/ui/card'
import { FileQuestion } from 'lucide-react'
import Link from 'next/link'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
            <FileQuestion className="size-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">Page Not Found</CardTitle>
          <CardDescription>
            The page you're looking for doesn't exist or has been moved to a different location.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Button asChild>
            <Link href='/'>Go Home</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href='/newsletters'>Browse Newsletters</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}