'use client'

import { api } from '@everynews/app/api'
import { auth } from '@everynews/auth/client'
import { SubmitButton } from '@everynews/components/submit-button'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@everynews/components/ui/avatar'
import { Button } from '@everynews/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@everynews/components/ui/card'
import { Input } from '@everynews/components/ui/input'
import { Label } from '@everynews/components/ui/label'
import { toastNetworkError } from '@everynews/lib/error'
import type { Alert } from '@everynews/schema/alert'
import type { Invitation } from '@everynews/schema/invitation'
import type { User } from '@everynews/schema/user'
import { CheckCircle2, Mail } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useId, useState } from 'react'
import { toast } from 'sonner'

interface InvitationAcceptanceProps {
  invitation: Invitation
  alert: Alert
  inviter: User
  user?: { id: string; email: string; createdAt: Date } | null
  isAlreadySubscribed: boolean
}

export const InvitationAcceptance = ({
  invitation,
  alert,
  inviter,
  user,
  isAlreadySubscribed,
}: InvitationAcceptanceProps) => {
  const [email, setEmail] = useState(invitation.inviteeEmail)
  const [isLoading, setIsLoading] = useState(false)
  const [isEmailSent, setIsEmailSent] = useState(false)
  const [isSubscribing, setIsSubscribing] = useState(false)
  const router = useRouter()
  const emailId = useId()

  // If user is already subscribed
  if (isAlreadySubscribed) {
    return (
      <Card className='w-full max-w-lg'>
        <CardHeader className='text-center'>
          <div className='mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900'>
            <CheckCircle2 className='size-6 text-green-600 dark:text-green-400' />
          </div>
          <CardTitle>Already Subscribed</CardTitle>
          <CardDescription>
            You're already subscribed to "{alert.name}"
          </CardDescription>
        </CardHeader>
        <CardContent className='text-center space-y-4'>
          <Link href={`/alerts/${alert.id}`}>
            <Button>View Alert</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  // If user is authenticated, they can accept directly
  if (user) {
    const handleAccept = async () => {
      try {
        setIsSubscribing(true)

        // Create subscription
        const response = await api.subscriptions.$post({
          json: {
            alertId: alert.id,
            channelId: null, // Default email channel
          },
        })

        if (!response.ok) {
          toast.error('Failed to subscribe')
          return
        }

        // Mark invitation as accepted
        await api.invitations[':token'].accept.$post({
          param: { token: invitation.token },
        })

        toast.success('Successfully subscribed!')
        router.push(`/alerts/${alert.id}`)
      } catch (error) {
        toastNetworkError(error as Error)
      } finally {
        setIsSubscribing(false)
      }
    }

    return (
      <Card className='w-full max-w-lg'>
        <CardHeader>
          <div className='flex items-center gap-4 mb-4'>
            <Avatar>
              <AvatarImage
                src={inviter.image || undefined}
                alt={inviter.name}
              />
              <AvatarFallback>
                {inviter.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className='font-semibold'>{inviter.name}</p>
              <p className='text-sm text-muted-foreground'>{inviter.email}</p>
            </div>
          </div>
          <CardTitle>You're invited to subscribe to {alert.name}</CardTitle>
          {invitation.message && (
            <div className='bg-muted rounded-md p-3 mt-4'>
              <p className='text-sm italic'>"{invitation.message}"</p>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {alert.description && (
              <p className='text-sm text-muted-foreground'>
                {alert.description}
              </p>
            )}
            <div className='flex gap-2'>
              <Link href='/'>
                <Button variant='outline'>Maybe Later</Button>
              </Link>
              <SubmitButton onClick={handleAccept} loading={isSubscribing}>
                Accept & Subscribe
              </SubmitButton>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // If user is not authenticated, show one-click subscribe flow
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    try {
      setIsLoading(true)
      await auth.signIn.magicLink(
        {
          callbackURL: `/subscriptions/success?alertId=${alert.id}&invitationToken=${invitation.token}`,
          email,
        },
        {
          headers: {
            'X-Alert-Id': alert.id,
            'X-Alert-Name': encodeURIComponent(alert.name),
            'X-Invitation-Token': invitation.token,
            'X-Subscription-Flow': 'true',
          },
        },
      )
      setIsEmailSent(true)
    } catch (error) {
      toastNetworkError(error as Error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isEmailSent) {
    return (
      <Card className='w-full max-w-lg'>
        <CardHeader className='text-center'>
          <div className='mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900'>
            <Mail className='size-6 text-green-600 dark:text-green-400' />
          </div>
          <CardTitle>Check Your Email</CardTitle>
          <CardDescription>
            We've sent a sign-in link to {email}
          </CardDescription>
        </CardHeader>
        <CardContent className='text-center'>
          <p className='text-sm text-muted-foreground'>
            Click the link in your email to sign in and accept the invitation.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className='w-full max-w-lg'>
      <CardHeader>
        <div className='flex items-center gap-4 mb-4'>
          <Avatar>
            <AvatarImage src={inviter.image || undefined} alt={inviter.name} />
            <AvatarFallback>
              {inviter.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className='font-semibold'>{inviter.name}</p>
            <p className='text-sm text-muted-foreground'>{inviter.email}</p>
          </div>
        </div>
        <CardTitle>
          {inviter.name} invited you to subscribe to {alert.name}
        </CardTitle>
        {invitation.message && (
          <div className='bg-muted rounded-md p-3 mt-4'>
            <p className='text-sm italic'>"{invitation.message}"</p>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {alert.description && (
            <p className='text-sm text-muted-foreground mb-4'>
              {alert.description}
            </p>
          )}

          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor={emailId}>Enter your email to accept</Label>
              <Input
                id={emailId}
                type='email'
                placeholder='Enter your email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className='flex gap-2 justify-end'>
              <Link href='/'>
                <Button type='button' variant='outline'>
                  Maybe Later
                </Button>
              </Link>
              <SubmitButton type='submit' loading={isLoading}>
                Accept Invitation
              </SubmitButton>
            </div>
          </form>
        </div>
      </CardContent>
    </Card>
  )
}
