'use cache'

import { siteConfig } from '@everynews/app/site-config'
import { LandingPageTabs } from '@everynews/components/landing-page-tabs'
import { db } from '@everynews/database'
import { alerts } from '@everynews/schema/alert'
import { contents } from '@everynews/schema/content'
import { stories } from '@everynews/schema/story'
import { desc, eq, sql } from 'drizzle-orm'

export const metadata = {
  description: siteConfig.description,
  title: siteConfig.name,
}

export default async function Page() {
  // Fetch recent stories for SaaS tab
  const recentStories = await db
    .select({
      alert: {
        id: alerts.id,
        name: alerts.name,
      },
      story: {
        id: stories.id,
        title: stories.title,
        createdAt: stories.createdAt,
        keyFindings: sql<string[]>`${stories.keyFindings}`,
        languageCode: stories.languageCode,
      },
      content: contents,
    })
    .from(stories)
    .innerJoin(contents, eq(stories.contentId, contents.id))
    .innerJoin(alerts, eq(stories.alertId, alerts.id))
    .where(eq(alerts.isPublic, true))
    .orderBy(desc(stories.createdAt))
    .limit(8)

  // First, get the latest story ID for each alert
  const latestStoryPerAlert = db.$with('latest_story_per_alert').as(
    db
      .select({
        alertId: stories.alertId,
        rowNum:
          sql<number>`ROW_NUMBER() OVER (PARTITION BY ${stories.alertId} ORDER BY ${stories.updatedAt} DESC)`.as(
            'row_num',
          ),
        storyId: stories.id,
        updatedAt: stories.updatedAt,
      })
      .from(stories)
      .innerJoin(alerts, eq(stories.alertId, alerts.id))
      .where(eq(alerts.isPublic, true)),
  )

  // Then fetch the full story details for the latest story per alert
  const latestPerAlert = await db
    .with(latestStoryPerAlert)
    .select({
      alert: {
        id: alerts.id,
        name: alerts.name,
      },
      story: {
        id: stories.id,
        title: stories.title,
        createdAt: stories.createdAt,
        keyFindings: sql<string[]>`${stories.keyFindings}`,
        languageCode: stories.languageCode,
      },
      content: contents,
    })
    .from(latestStoryPerAlert)
    .innerJoin(stories, eq(latestStoryPerAlert.storyId, stories.id))
    .innerJoin(contents, eq(stories.contentId, contents.id))
    .innerJoin(alerts, eq(stories.alertId, alerts.id))
    .where(eq(latestStoryPerAlert.rowNum, 1))
    .orderBy(desc(latestStoryPerAlert.updatedAt))
    .limit(8)

  return (
    <div className='min-h-dvh bg-background container'>
      <div className='container mx-auto px-6 pt-20 pb-16 flex flex-col gap-12'>
        {/* Hero Section */}
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

        <LandingPageTabs
          recentStories={recentStories}
          latestPerAlert={latestPerAlert}
        />
      </div>
    </div>
  )
}
