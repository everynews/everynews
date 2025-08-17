'use client'

import { api } from '@everynews/app/api'
import { SubmitButton } from '@everynews/components/submit-button'
import { Card, CardContent } from '@everynews/components/ui/card'
import { Label } from '@everynews/components/ui/label'
import { Textarea } from '@everynews/components/ui/textarea'
import { toastNetworkError } from '@everynews/lib/error'
import type { Alert } from '@everynews/schema/alert'
import { CheckCircle2, Mail } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useId, useState } from 'react'
import { toast } from 'sonner'

interface InviteToAlertFormProps {
  alert: Alert
  user: { id: string; email: string; name: string; image?: string | null }
}

export const InviteToAlertForm = ({ alert }: InviteToAlertFormProps) => {
  const [emails, setEmails] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [invitationsSent, setInvitationsSent] = useState(false)
  const [sentCount, setSentCount] = useState(0)
  const [skippedCount, setSkippedCount] = useState(0)
  const router = useRouter()
  const emailsId = useId()
  const messageId = useId()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Parse and validate emails (one per line)
    const totalEmailList = emails
      .split('\n')
      .map((email) => email.trim())
      .filter((email) => email.length > 0)

    const emailList = [...new Set(totalEmailList)]

    if (emailList.length === 0) {
      toast.error('Please enter at least one email address')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const invalidEmails = emailList.filter((email) => !emailRegex.test(email))

    if (invalidEmails.length > 0) {
      toast.error(`Invalid email addresses: ${invalidEmails.join(', ')}`)
      return
    }

    try {
      setIsLoading(true)
      const response = await api.alerts[':id'].invite.$post({
        json: {
          emails: emailList,
          message: message.trim() || undefined,
        },
        param: { id: alert.id },
      })

      if (!response.ok) {
        const error = await response.text()
        toast.error(error || 'Failed to send invitations')
        return
      }

      const result = await response.json()
      setSentCount(result.sent)
      setSkippedCount(result.skipped || 0)
      setInvitationsSent(true)

      let toastMessage = `${result.sent} invitation${result.sent === 1 ? '' : 's'} sent successfully`
      if (result.skipped > 0) {
        toastMessage += ` (${result.skipped} skipped - already invited)`
      }
      toast.success(toastMessage)
    } catch (error) {
      toastNetworkError(error as Error)
    } finally {
      setIsLoading(false)
    }
  }

  if (invitationsSent) {
    return (
      <Card>
        <CardContent className='p-6'>
          <div className='flex flex-col items-center text-center gap-4'>
            <div className='flex size-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900'>
              <CheckCircle2 className='size-6 text-green-600 dark:text-green-400' />
            </div>
            <div className='flex flex-col gap-2'>
              <p className='text-lg font-medium'>Invitations sent!</p>
              <div className='flex flex-col items-center gap-1'>
                <div className='flex items-center justify-center gap-1 text-sm text-muted-foreground'>
                  <Mail className='size-4' />
                  <span>
                    {sentCount} invitation{sentCount === 1 ? '' : 's'} sent
                  </span>
                </div>
                {skippedCount > 0 && (
                  <p className='text-sm text-muted-foreground'>
                    {skippedCount} skipped (already invited)
                  </p>
                )}
              </div>
            </div>
            <div className='flex gap-2'>
              <SubmitButton
                variant='outline'
                onClick={() => {
                  setInvitationsSent(false)
                  setEmails('')
                  setMessage('')
                  setSentCount(0)
                  setSkippedCount(0)
                }}
                loading={false}
              >
                Send More Invites
              </SubmitButton>
              <SubmitButton
                onClick={() => router.push(`/alerts/${alert.id}`)}
                loading={false}
              >
                Back to Alert
              </SubmitButton>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <div className='space-y-2'>
        <Label htmlFor={emailsId}>Email addresses</Label>
        <Textarea
          id={emailsId}
          placeholder='email@example.com'
          value={emails}
          onChange={(e) => setEmails(e.target.value)}
          required
          rows={10}
        />
        <p className='text-xs text-muted-foreground'>
          Enter one email address per line
        </p>
      </div>

      <div className='space-y-2'>
        <Label htmlFor={messageId}>Personal message (optional)</Label>
        <Textarea
          id={messageId}
          placeholder='I thought you might be interested in this alert...'
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          className='resize-none'
        />
        <p className='text-xs text-muted-foreground'>
          This message will be included in the invitation email
        </p>
      </div>

      <div className='flex gap-2 justify-end'>
        <SubmitButton
          variant='outline'
          onClick={() => router.push(`/alerts/${alert.id}`)}
          loading={false}
        >
          Cancel
        </SubmitButton>
        <SubmitButton type='submit' loading={isLoading}>
          Send Invitations
        </SubmitButton>
      </div>
    </form>
  )
}
