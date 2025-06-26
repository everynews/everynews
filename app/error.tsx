'use client'

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string }
}) {
  return (
    <div className='container mx-auto px-6 py-10 max-w-2xl mx-auto'>
      <h2 className='text-2xl font-bold mb-4'>Something went wrong</h2>
      <p className='mb-4 text-sm text-muted-foreground'>
        Please report the following error to support@every.news.
      </p>
      <code className='text-sm whitespace-pre-wrap'>
        {JSON.stringify(error)}
      </code>
    </div>
  )
}
