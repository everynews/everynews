'use client'

import { api } from '@everynews/app/api'
import { Badge } from '@everynews/components/ui/badge'
import { Button } from '@everynews/components/ui/button'
import { Card } from '@everynews/components/ui/card'
import { format } from 'date-fns'
import { Globe, Monitor, Smartphone } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

interface SessionsListProps {
  sessions: Array<{
    id: string
    userId: string
    token: string
    expiresAt: Date
    createdAt: Date
    updatedAt: Date
    ipAddress?: string | null
    userAgent?: string | null
  }>
}

const getDeviceIcon = (userAgent?: string | null) => {
  if (!userAgent) return <Globe className='size-4' />

  const ua = userAgent.toLowerCase()
  if (
    ua.includes('mobile') ||
    ua.includes('android') ||
    ua.includes('iphone')
  ) {
    return <Smartphone className='size-4' />
  }
  return <Monitor className='size-4' />
}

const getDeviceName = (userAgent?: string | null) => {
  if (!userAgent) return 'Unknown Device'

  const ua = userAgent.toLowerCase()
  if (ua.includes('chrome')) return 'Chrome'
  if (ua.includes('firefox')) return 'Firefox'
  if (ua.includes('safari')) return 'Safari'
  if (ua.includes('edge')) return 'Edge'
  return 'Unknown Browser'
}

export const SessionsList = ({ sessions }: SessionsListProps) => {
  const router = useRouter()
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(
    null,
  )

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingSessionId(sessionId)
    try {
      const response = await api.sessions[':id'].$delete({
        param: { id: sessionId },
      })

      if (response.ok) {
        toast.success('Session revoked', {
          description: 'The session has been revoked successfully.',
        })
        router.refresh()
      } else {
        throw new Error('Failed to revoke session')
      }
    } catch (_error) {
      toast.error('Error', {
        description: 'Failed to revoke session. Please try again.',
      })
    } finally {
      setRevokingSessionId(null)
    }
  }

  if (sessions.length === 0) {
    return (
      <p className='text-sm text-muted-foreground'>No active sessions found.</p>
    )
  }

  return (
    <div className='space-y-2'>
      {sessions.map((session, index) => (
        <Card key={session.id} className='p-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              {getDeviceIcon(session.userAgent)}
              <div>
                <div className='flex items-center gap-2'>
                  <p className='font-medium'>
                    {getDeviceName(session.userAgent)}
                  </p>
                  {index === 0 && (
                    <Badge variant='default' className='text-xs'>
                      Current
                    </Badge>
                  )}
                </div>
                <p className='text-sm text-muted-foreground'>
                  {session.ipAddress || 'Unknown IP'} • Last active{' '}
                  {format(session.updatedAt, 'PPp')}
                </p>
              </div>
            </div>
            {index !== 0 && (
              <Button
                variant='outline'
                size='sm'
                onClick={() => handleRevokeSession(session.id)}
                disabled={revokingSessionId === session.id}
              >
                {revokingSessionId === session.id ? 'Revoking...' : 'Revoke'}
              </Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  )
}
