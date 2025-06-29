'use cache'

import { siteConfig } from '@everynews/app/site-config'
import { LandingPageTabs } from '@everynews/components/landing-page-tabs'
import { db } from '@everynews/database'
import { AlertSchema, alerts } from '@everynews/schema/alert'
import { ContentSchema, contents } from '@everynews/schema/content'
import { StorySchema, stories } from '@everynews/schema/story'
import { eq, sql } from 'drizzle-orm'
import { z } from 'zod'

export const metadata = {
  description: siteConfig.description,
  title: siteConfig.name,
}

// Define the result schema for type safety and validation
const LatestStorySchema = z.object({
  alert: AlertSchema,
  content: ContentSchema,
  story: StorySchema,
})

export default async function Page() {
  const latest = await db
    .selectDistinctOn([stories.alertId], {
      alert: alerts,
      content: contents,
      story: stories,
    })
    .from(stories)
    .innerJoin(alerts, eq(stories.alertId, alerts.id))
    .innerJoin(contents, eq(stories.contentId, contents.id))
    .where(eq(alerts.isPublic, true))
    .orderBy(stories.alertId, sql`${stories.updatedAt} DESC`)
    .limit(20)
    .then((rows) => rows.map((row) => LatestStorySchema.parse(row)))

  return (
    <div className='min-h-dvh bg-background container'>
      <div className='container mx-auto px-6 pt-20 pb-16 flex flex-col gap-12'>
        <div className='text-center max-w-6xl mx-auto flex flex-col gap-6 w-full'>
          <h1 className='text-6xl font-bold tracking-tight text-foreground w-full flex flex-col md:flex-row gap-2 justify-center'>
            <span>Agentic</span>
            <span>Google</span>
            <span>Alerts</span>
          </h1>
          <p className='text-muted-foreground leading-relaxed w-full mx-auto text-balance text-center flex flex-col md:flex-row gap-1 justify-center'>
            <span>Semantic Monitoring.</span>
            <span>Context Understanding.</span>
            <span>Granular Delivery.</span>
          </p>
        </div>

        <LandingPageTabs latest={latest} />
      </div>
    </div>
  )
}
