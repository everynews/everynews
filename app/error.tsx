'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang='en'>
      <body>
        <div className='container mx-auto px-6 py-10 max-w-2xl mx-auto'>
          <h2 className='text-2xl font-bold mb-4'>Something went wrong!</h2>
          <button
            className='px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600'
            onClick={() => reset()}
            type='button'
          >
            Try again
          </button>
          <a href='https://every.news/'>Back to Everynews</a>
          <p>{JSON.stringify(error)}</p>
        </div>
      </body>
    </html>
  )
}
