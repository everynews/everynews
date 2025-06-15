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
            So, I promise that if you <strong>report a bug</strong> or{' '}
            <strong>ask for a feature</strong> that's reasonably sized, I will
            personally fix it within <strong>3 days</strong>.
          </p>
          <p>
            Not 3 weeks. Not <q>we'll get back to you.</q> Not a ticket in some
            corporate queue. <strong>3 days, fixed, by me.</strong>
          </p>
          <p>
            You'll get a personal response from me (yes, the actual founder)
            within hours. I'll fix it, and I'll personally let you know it's
            done. People say this is{' '}
            <Link
              className='text-blue-500'
              href='https://paulgraham.com/foundermode.html'
            >
              founder mode
            </Link>
            . But I think that term is a bit cliché and cheesy. So I'm calling
            it firefighter 🧑‍🚒 mode. This isn't sustainable forever, but your
            experience matters more than anything else right now.
          </p>

          <p>
            So, found something broken? Or want a new feature?{' '}
            <Link className='text-blue-500' href='mailto:sunghyun@every.news'>
              Email me
            </Link>{' '}
            or{' '}
            <Link
              className='text-blue-500'
              href='https://github.com/everynews/everynews/issues'
            >
              leave an issue
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
