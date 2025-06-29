'use client'

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string }
}) {
  return (
    <div className='container mx-auto px-6 py-10 max-w-2xl mx-auto'>
      <h2 className='text-2xl font-bold mb-4'>Oops.</h2>
      <p className='mb-4 text-sm text-muted-foreground'>
        We&apos;re really sorry. Please report the following Error ID to
        support@every.news.
      </p>
      <p className='text-sm whitespace-pre-wrap tabular-nums bg-muted p-2 rounded-md'>
        {error.digest}
      </p>
    </div>
  )
}
