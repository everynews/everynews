import Link from 'next/link'

export const metadata = {
  description: 'SMS notification consent for Everynews',
  title: 'Can We Text You?',
}

export default function CanWeTextYouPage() {
  return (
    <div className='container mx-auto max-w-4xl px-4 py-8'>
      <h1 className='mb-8 text-4xl font-bold'>Can We Text You?</h1>

      <div className='prose prose-gray max-w-none dark:prose-invert'>
        <section className='mb-8'>
          <h2 className='text-2xl font-semibold mb-4'>SMS Notifications</h2>
          <p className='mb-4'>
            We'd like to send you important updates via SMS. Before we can do
            that, we need your consent.
          </p>
        </section>

        <section className='mb-8'>
          <h2 className='text-2xl font-semibold mb-4'>What You Need to Know</h2>

          <div className='space-y-4'>
            <div>
              <h3 className='text-xl font-semibold mb-2'>Who We Are</h3>
              <p>Everynews: AI-powered news monitoring service</p>
            </div>

            <div>
              <h3 className='text-xl font-semibold mb-2'>Why We'll Text You</h3>
              <p>We'll send you important updates about your alerts.</p>
            </div>

            <div>
              <h3 className='text-xl font-semibold mb-2'>Message Frequency</h3>
              <p>
                Message frequency varies based on your alert settings. We will
                exactly send you the number of alerts you request.
              </p>
            </div>

            <div>
              <h3 className='text-xl font-semibold mb-2'>Cost</h3>
              <p>
                Standard message and data rates may apply based on your mobile
                carrier's plan.
              </p>
            </div>

            <div>
              <h3 className='text-xl font-semibold mb-2'>How to Opt Out</h3>
              <p>
                You can stop receiving messages at any time by texting STOP to
                any message we send you. Text HELP for assistance.
              </p>
            </div>

            <div>
              <h3 className='text-xl font-semibold mb-2'>Your Privacy</h3>
              <p>
                We take your privacy seriously. Your phone number will only be
                used for the purposes described above and will be handled
                according to our{' '}
                <Link
                  href='/privacy'
                  className='text-orange-500 hover:underline'
                >
                  privacy policy
                </Link>
                .
              </p>
            </div>
          </div>
        </section>

        <section className='mb-8'>
          <h2 className='text-2xl font-semibold mb-4'>Consent Language</h2>
          <div className='rounded-lg bg-muted p-6'>
            <p className='text-sm'>
              By <strong>verifying your number on this service</strong>, you authorize Everynews
              to text the number you provided with offers & other information,
              possibly using automated means. Message/data rates apply. Message
              frequency varies. Text HELP for help or STOP to opt out. Consent
              is not a condition of purchase. See{' '}
              <Link href='/privacy' className='text-orange-500 hover:underline'>
                privacy policy
              </Link>
              .
            </p>
          </div>
        </section>

        <section className='mb-8'>
          <Link
            href='/alerts'
            className='text-orange-500 hover:underline text-lg text-center w-full block'
          >
            Return to Alerts
          </Link>
        </section>
      </div>
    </div>
  )
}
