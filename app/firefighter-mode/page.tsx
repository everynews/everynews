import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@everynews/components/ui/tooltip'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export const metadata = {
  description: 'Bug fixing promise for early users.',
  title: 'Firefighter Mode',
}

export default function FirefighterModePage() {
  return (
    <div className='container mx-auto px-6 py-10 max-w-2xl mx-auto'>
      <div className='prose prose-lg dark:prose-invert max-w-none'>
        <h1 className='text-3xl font-bold mb-8'>Firefighter Mode 🧑‍🚒</h1>
        <div className='flex flex-col gap-6 leading-relaxed'>
          <p>
            We are in{' '}
            <span className='inline-block rounded-md bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'>
              beta
            </span>{' '}
            and things are literally on{' '}
            <Tooltip>
              <TooltipTrigger>🔥</TooltipTrigger>
              <TooltipContent>fire</TooltipContent>
            </Tooltip>
            . However I do care a lot about your experience and genuinely hope
            you like my service.
          </p>
          <p>
            So, I promise that{' '}
            <strong>
              if you report a bug that's reasonably sized, I will personally fix
              it within 3 days.
            </strong>{' '}
            Not 3 weeks. Not <q>we'll get back to you.</q> Not a ticket in some
            corporate queue.
          </p>

          <p>
            3 days, fixed, by me. You'll get a personal response from me (yes,
            the actual founder) within hours. I'll fix it, and I'll personally
            let you know it's done.
          </p>
          <p>
            People say this is{' '}
            <Link
              className='text-blue-500 hover:underline'
              href='https://paulgraham.com/foundermode.html'
              target='_blank'
              rel='noopener noreferrer'
            >
              founder mode
            </Link>
            . But I think that term is a bit cliché and cheesy. So I'm calling
            it firefighter 🧑‍🚒 mode. This isn't sustainable forever, but it's
            how we'll see how far I could drive this. Your experience matters
            more than anything else right now.
          </p>

          <p>
            So, found something broken? Email me at{' '}
            <Link
              className='text-blue-500 hover:underline'
              href='mailto:sunghyun@every.news'
              target='_blank'
              rel='noopener noreferrer'
            >
              sunghyun@every.news
            </Link>{' '}
            or leave an{' '}
            <Link
              className='text-blue-500 hover:underline'
              href='https://github.com/everynews/everynews/issues'
              target='_blank'
              rel='noopener noreferrer'
            >
              issue
            </Link>
            .
          </p>

          <p>
            Best,
            <br />
            Sunghyun
          </p>
        </div>
      </div>
    </div>
  )
}
