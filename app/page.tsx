'use cache'

import { siteConfig } from '@everynews/app/site-config'
import { Badge } from '@everynews/components/ui/badge'
import { Button } from '@everynews/components/ui/button'
import { Card, CardContent, CardHeader } from '@everynews/components/ui/card'
import { db } from '@everynews/database'
import { alerts } from '@everynews/schema/alert'
import { contents } from '@everynews/schema/content'
import { stories } from '@everynews/schema/story'
import { desc, eq } from 'drizzle-orm'
import {
  AlertCircle,
  Blocks,
  CheckCircle,
  Globe,
  HelpCircle,
  X,
  Zap,
} from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  description: siteConfig.description,
  title: siteConfig.name,
}

export default async function Page() {
  const recentStories = await db
    .select({
      alert: alerts,
      content: contents,
      story: stories,
    })
    .from(stories)
    .innerJoin(contents, eq(stories.contentId, contents.id))
    .innerJoin(alerts, eq(stories.alertId, alerts.id))
    .where(eq(alerts.isPublic, true))
    .orderBy(desc(stories.createdAt))
    .limit(8)

  return (
    <div className='min-h-dvh bg-background container'>
      {/* Hero Section */}
      <div className='container mx-auto px-6 pt-20 pb-16 flex flex-col gap-20'>
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

        <div className='mx-auto max-w-xl p-4 rounded-lg flex flex-col items-center gap-2'>
          <p className='text-sm text-orange-800 dark:text-orange-200 text-center'>
            If you ask something today, we ship it tomorrow.
          </p>
          <Button
            asChild
            className='bg-orange-700 text-white hover:bg-orange-900 text-center'
          >
            <Link href='/firefighter-mode'>
              Everynews is in Firefighting Mode
            </Link>
          </Button>
        </div>

        {/* Problem Statement */}
        <div className='max-w-6xl mx-auto flex flex-col gap-12 w-full'>
          <div className='text-center flex flex-col gap-4 w-full'>
            <h2 className='text-3xl font-bold text-foreground w-full'>
              Beyond Traditional Alerts
            </h2>
            <p className='text-lg text-muted-foreground w-full  mx-auto'>
              Traditional monitoring tools fall short in today's complex
              information landscape
            </p>
          </div>

          <div className='grid md:grid-cols-3 gap-8'>
            <Card className='border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20 w-full'>
              <CardContent className='p-6 flex flex-col gap-4'>
                <div className='text-red-600'>
                  <div className='w-12 h-12 bg-red-100 dark:bg-red-950/30 rounded-lg flex items-center justify-center'>
                    <X className='w-6 h-6' />
                  </div>
                </div>
                <h3 className='font-semibold text-foreground'>Too Literal</h3>
                <p className='text-sm text-muted-foreground'>
                  Want to monitor the SWIFT banking system? Good luck filtering
                  through Taylor Swift news.
                </p>
              </CardContent>
            </Card>

            <Card className='border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20 w-full'>
              <CardContent className='p-6 flex flex-col gap-4'>
                <div className='text-red-600'>
                  <div className='w-12 h-12 bg-red-100 dark:bg-red-950/30 rounded-lg flex items-center justify-center'>
                    <HelpCircle className='w-6 h-6' />
                  </div>
                </div>
                <h3 className='font-semibold text-foreground'>No Context</h3>
                <p className='text-sm text-muted-foreground'>
                  Searching for "new models"? You'll get everything from AI to
                  fashion runway shows.
                </p>
              </CardContent>
            </Card>

            <Card className='border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20 w-full'>
              <CardContent className='p-6 flex flex-col gap-4'>
                <div className='text-red-600'>
                  <div className='w-12 h-12 bg-red-100 dark:bg-red-950/30 rounded-lg flex items-center justify-center'>
                    <AlertCircle className='w-6 h-6' />
                  </div>
                </div>
                <h3 className='font-semibold text-foreground'>
                  Limited Delivery
                </h3>
                <p className='text-sm text-muted-foreground'>
                  Stuck with basic email alerts when you need Slack, webhooks,
                  or custom scheduling.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Solutions */}
        <div className='max-w-6xl mx-auto flex flex-col gap-12 w-full'>
          <div className='text-center flex flex-col gap-4 w-full'>
            <h2 className='text-3xl font-bold text-foreground w-full'>
              Intelligent Monitoring, Reimagined
            </h2>
            <p className='text-lg text-muted-foreground w-full  mx-auto'>
              Powered by AI and designed for modern workflows
            </p>
          </div>

          <div className='grid md:grid-cols-3 gap-8'>
            <Card className='border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/20 w-full'>
              <CardContent className='p-6 flex flex-col gap-4'>
                <div className='text-orange-600'>
                  <Zap className='w-8 h-8' />
                </div>
                <h3 className='font-semibold text-foreground'>
                  Semantic Intelligence
                </h3>
                <ul className='flex flex-col gap-2 text-sm text-muted-foreground'>
                  <li className='flex items-start gap-2'>
                    <CheckCircle className='w-4 h-4 text-orange-500 flex-shrink-0' />
                    <span>LLM-powered context understanding</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <CheckCircle className='w-4 h-4 text-orange-500 flex-shrink-0' />
                    <span>Vector-based semantic matching</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <CheckCircle className='w-4 h-4 text-orange-500 flex-shrink-0' />
                    <span>Domain-specific intelligence</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className='border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20 w-full'>
              <CardContent className='p-6 flex flex-col gap-4'>
                <div className='text-green-600'>
                  <Globe className='w-8 h-8' />
                </div>
                <h3 className='font-semibold text-foreground'>
                  Flexible Delivery
                </h3>
                <ul className='flex flex-col gap-2 text-sm text-muted-foreground'>
                  <li className='flex items-start gap-2'>
                    <CheckCircle className='w-4 h-4 text-green-500 flex-shrink-0' />
                    <span>Time-based batching (8 AM Seoul time)</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <CheckCircle className='w-4 h-4 text-green-500 flex-shrink-0' />
                    <span>Volume-based triggers</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <CheckCircle className='w-4 h-4 text-green-500 flex-shrink-0' />
                    <span>Email, Slack, webhooks & APIs</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            <Card className='border-purple-200 bg-purple-50/50 dark:border-purple-800 dark:bg-purple-950/20 w-full'>
              <CardContent className='p-6 flex flex-col gap-4'>
                <div className='text-purple-600'>
                  <Blocks className='w-8 h-8' />
                </div>
                <h3 className='font-semibold text-foreground'>
                  Learning System
                </h3>
                <ul className='flex flex-col gap-2 text-sm text-muted-foreground'>
                  <li className='flex items-start gap-2'>
                    <CheckCircle className='w-4 h-4 text-purple-500 flex-shrink-0' />
                    <span>Feedback-driven improvements</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <CheckCircle className='w-4 h-4 text-purple-500 flex-shrink-0' />
                    <span>Relevance scoring</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <CheckCircle className='w-4 h-4 text-purple-500 flex-shrink-0' />
                    <span>Continuous optimization</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Use Cases */}
        <div className='max-w-6xl mx-auto flex flex-col gap-8 w-full'>
          <div className='text-center w-full'>
            <h2 className='text-3xl font-bold text-foreground w-full'>
              Built for Modern Teams
            </h2>
          </div>

          <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-4'>
            <div className='p-6 rounded-lg border bg-card flex flex-col gap-3 w-full'>
              <h3 className='font-semibold text-foreground'>Professionals</h3>
              <ul className='list-disc list-inside flex flex-col gap-1 text-sm text-muted-foreground'>
                <li>Personal brand monitoring</li>
                <li>Industry trends</li>
                <li>Competitive intelligence</li>
              </ul>
            </div>
            <div className='p-6 rounded-lg border bg-card flex flex-col gap-3 w-full'>
              <h3 className='font-semibold text-foreground'>Research Teams</h3>
              <ul className='list-disc list-inside flex flex-col gap-1 text-sm text-muted-foreground'>
                <li>Academic papers</li>
                <li>Patent monitoring</li>
                <li>Technical developments</li>
              </ul>
            </div>
            <div className='p-6 rounded-lg border bg-card flex flex-col gap-3 w-full'>
              <h3 className='font-semibold text-foreground'>Business Teams</h3>
              <ul className='list-disc list-inside flex flex-col gap-1 text-sm text-muted-foreground'>
                <li>Market analysis</li>
                <li>Competitor tracking</li>
                <li>Brand sentiment</li>
              </ul>
            </div>
            <div className='p-6 rounded-lg border bg-card flex flex-col gap-3 w-full'>
              <h3 className='font-semibold text-foreground'>
                PR & Communications
              </h3>
              <ul className='list-disc list-inside flex flex-col gap-1 text-sm text-muted-foreground'>
                <li>Brand mentions</li>
                <li>Campaign performance</li>
                <li>Media coverage</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Recent Stories Section */}
        <div className='max-w-6xl mx-auto flex flex-col gap-12 w-full'>
          <div className='text-center flex flex-col gap-4 w-full'>
            <h2 className='text-3xl font-bold text-foreground w-full'>
              Latest Discoveries
            </h2>
            <p className='text-lg text-muted-foreground w-full  mx-auto'>
              See what our AI-powered system is finding right now
            </p>
          </div>

          <div className='grid md:grid-cols-2 gap-6'>
            {recentStories.map(({ story, alert: alertInfo }) => (
              <Link
                key={story.id}
                href={`/stories/${story.id}`}
                lang={story.languageCode}
              >
                <Card className='hover:shadow-lg transition-all duration-200 cursor-pointer bg-card w-full'>
                  <CardHeader className='pb-3 flex flex-col gap-2'>
                    <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                      <Badge variant='secondary' className='text-xs'>
                        {alertInfo.name}
                      </Badge>
                      <span>•</span>
                      <time dateTime={story.createdAt.toISOString()}>
                        {story.createdAt.toLocaleDateString('en-US', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </time>
                    </div>
                    <h3 className='font-semibold text-foreground line-clamp-2 leading-tight'>
                      {story.title}
                    </h3>
                  </CardHeader>

                  {Array.isArray(story.keyFindings) &&
                    story.keyFindings.length > 0 && (
                      <CardContent className='pt-0'>
                        <div className='flex flex-col gap-2'>
                          {story.keyFindings
                            .slice(0, 2)
                            .map((finding, index) => (
                              <div
                                key={`${story.id}-finding-${index}`}
                                className='flex items-center gap-2'
                              >
                                <Badge
                                  variant='outline'
                                  className='text-xs px-1.5 py-0.5 flex-shrink-0'
                                >
                                  {index + 1}
                                </Badge>
                                <p className='flex-1 text-xs text-muted-foreground line-clamp-2'>
                                  {finding}
                                </p>
                              </div>
                            ))}
                          {story.keyFindings.length > 2 && (
                            <p className='text-xs text-muted-foreground'>
                              +{story.keyFindings.length - 2} more insights
                            </p>
                          )}
                        </div>
                      </CardContent>
                    )}
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
