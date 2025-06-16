import { Badge } from '@everynews/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@everynews/components/ui/tooltip'
import Link from 'next/link'

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
            Everynews is in{' '}
            <Badge
              variant='outline'
              className='-top-0.5 relative bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-300 dark:border-orange-900'
            >
              open beta
            </Badge>{' '}
            and things are literally on{' '}
            <Tooltip>
              <TooltipTrigger>🔥</TooltipTrigger>
              <TooltipContent>fire</TooltipContent>
            </Tooltip>
            . However I do care a lot about your experience and genuinely hope
            you like my service.
          </p>
          <p>
            So, I promise that if you report a{' '}
            <Badge
              variant='outline'
              className='-top-0.5 relative bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-300 dark:border-red-900'
            >
              bug
            </Badge>{' '}
            or request a{' '}
            <Badge
              variant='outline'
              className='-top-0.5 relative bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-300 dark:border-blue-900'
            >
              feature
            </Badge>{' '}
            that's reasonably sized, I will personally fix it{' '}
            <strong>today</strong> and ship it <strong>tomorrow</strong>.
          </p>
          <p>
            You'll get a personal response from me (yes, the actual founder)
            within hours. I'll fix it, and I'll personally let you know it's
            done. People say this is{' '}
            <Link
              className='text-orange-500'
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
            <Link className='text-orange-500' href='mailto:sunghyun@every.news'>
              Email me
            </Link>{' '}
            or{' '}
            <Link
              className='text-orange-500'
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
