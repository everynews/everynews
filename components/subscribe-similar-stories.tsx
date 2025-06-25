'use client'

import { OneClickSubscribeForm } from '@everynews/components/one-click-subscribe-form'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@everynews/components/ui/card'
import type { Alert } from '@everynews/schema/alert'

interface SubscribeSimilarStoriesProps {
  alert: Alert
  className?: string
}

export const SubscribeSimilarStories = ({
  alert,
  className,
}: SubscribeSimilarStoriesProps) => {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className='text-lg'>Subscribe to Similar Stories</CardTitle>
      </CardHeader>
      <CardContent>
        <p className='text-sm text-muted-foreground mb-4'>
          Get notified when new stories are published for "{alert.name}"
        </p>
        <OneClickSubscribeForm alert={alert} />
      </CardContent>
    </Card>
  )
}
