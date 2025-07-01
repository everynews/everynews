import { siteConfig } from '@everynews/app/site-config'
import { LandingPageTabs } from '@everynews/components/landing-page-tabs'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@everynews/components/ui/avatar'
import { Link } from 'lucide-react'

export const metadata = {
  description: siteConfig.description,
  title: siteConfig.name,
}

export default async function Page() {
  return (
    <div className='min-h-dvh bg-background container'>
      <div className='container mx-auto px-6 pt-20 pb-16 flex flex-col gap-12'>
        <div className='text-center max-w-6xl mx-auto flex flex-col gap-6 w-full  py-24'>
          <div className='text-center flex flex-col gap-4 w-full'>
            <div className='flex justify-center gap-8'>
              <div className='flex gap-2 items-end'>
                <div>
                  <Avatar className='border'>
                    <AvatarImage src='/logo.png' />
                    <AvatarFallback>E</AvatarFallback>
                  </Avatar>
                </div>
                <div className='flex flex-col gap-1 items-start'>
                  <div className='relative'>
                    <div className='bg-blue-500 text-primary-foreground px-4 py-2 rounded-full'>
                      <span className='text-lg text-white'>
                        bro did u see this
                      </span>
                    </div>
                  </div>
                  <div className='relative'>
                    <div className='bg-muted text-muted-foreground px-4 py-2 rounded-full flex items-center gap-1'>
                      <Link className='size-4' />
                      news.ycombinator.com
                    </div>
                  </div>
                  <div className='relative mb-4'>
                    <div className='bg-blue-500 text-primary-foreground px-4 py-2 rounded-full rounded-bl-xs'>
                      <span className='text-lg text-white'>
                        ig they&apos;re ur new competitor
                      </span>
                    </div>
                    <div className='absolute -bottom-1 left-0 w-0 h-0 border-t-8 border-t-blue-500 border-r-8 border-r-transparent'></div>
                  </div>
                </div>
              </div>
            </div>
            <p className='text-lg text-muted-foreground w-full mx-auto'>
              We all have that one friend who sends the most urgent news.
            </p>
            <p className='text-lg text-muted-foreground w-full mx-auto'>
              Everynews is one of them.
            </p>
          </div>
        </div>
        <LandingPageTabs />
      </div>
    </div>
  )
}
