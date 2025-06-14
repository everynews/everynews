import { Badge } from '@everynews/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@everynews/components/ui/tooltip'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function FirefighterModePage() {
  return (
    <div className='container mx-auto px-6 py-20 max-w-2xl mx-auto'>
      <div className='prose prose-lg dark:prose-invert max-w-none'>
        <h1 className='text-3xl font-bold mb-8'>Firefighter Mode 🧑‍🚒</h1>
        <div className='flex flex-col gap-6 leading-relaxed'>
          <p>
            We are in <Badge variant='outline'>Beta</Badge> and things are
            literally on{' '}
            <Tooltip>
              <TooltipTrigger>🔥</TooltipTrigger>
              <TooltipContent>fire</TooltipContent>
            </Tooltip>
            , <strong>crash-and-burn</strong>-ing. But I actually do care a lot
            about your experience. I genuinely hope you like my service.
          </p>
          <p>
            So here's my promise.{' '}
            <strong>
              If you report a bug that's reasonably sized, I will personally fix
              it within 3 days.
            </strong>{' '}
            Not 3 weeks. Not <q>we'll get back to you.</q> Not a ticket in some
            corporate queue.
          </p>

          <p>
            <strong>3 days. Fixed. By me.</strong> You'll get a personal
            response from me (yes, the actual founder) within hours. I'll
            identify the{' '}
            <Tooltip>
              <TooltipTrigger>🧨</TooltipTrigger>
              <TooltipContent>error</TooltipContent>
            </Tooltip>
            ,
            <Tooltip>
              <TooltipTrigger>🧯-it</TooltipTrigger>
              <TooltipContent>fix it</TooltipContent>
            </Tooltip>
            , and{' '}
            <Tooltip>
              <TooltipTrigger>🚢-it</TooltipTrigger>
              <TooltipContent>ship it</TooltipContent>
            </Tooltip>
            . Then I'll personally let you know it's done.
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
            it <strong>Firefighter Mode</strong>. This isn't sustainable
            forever, but it's how we'll see how far I could drive this. Your
            experience matters more than anything else right now.
          </p>

          <p>So, found something broken?</p>
          <p>
            Email me at{' '}
            <Link
              className='text-blue-500 hover:underline'
              href='mailto:sunghyun@every.news'
              target='_blank'
              rel='noopener noreferrer'
            >
              sunghyun@every.news
            </Link>{' '}
            or leave a{' '}
            <Link
              className='text-blue-500 hover:underline'
              href='https://github.com/everynews/everynews/issues'
              target='_blank'
              rel='noopener noreferrer'
            >
              GitHub issue
            </Link>
            . Firefighter is on the way.
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
