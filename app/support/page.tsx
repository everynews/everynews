import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Support | Everynews',
  description: 'Get help with Everynews',
}

export default function SupportPage() {
  return (
    <div className='container max-w-2xl py-8 px-2 sm:px-0'>
      <h1 className='text-3xl font-bold mb-6'>Support</h1>
      
      <div className='space-y-6'>
        <p className='text-muted-foreground'>
          Need help with Everynews? We're here to assist you.
        </p>
        
        <div className='rounded-lg border bg-card p-6'>
          <h2 className='text-xl font-semibold mb-3'>Contact Us</h2>
          <p className='mb-4'>
            For all inquiries, please email us at:
          </p>
          <a
            href='mailto:support@every.news'
            className='text-lg font-medium text-primary hover:underline'
          >
            support@every.news
          </a>
        </div>
        
        <div className='text-sm text-muted-foreground'>
          <p>We typically respond within 24-48 hours.</p>
        </div>
      </div>
    </div>
  )
}