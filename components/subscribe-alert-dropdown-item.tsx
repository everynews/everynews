'use client'

import { Dialog, DialogContent } from '@everynews/components/ui/dialog'
import { DropdownMenuItem } from '@everynews/components/ui/dropdown-menu'
import type { Alert } from '@everynews/schema/alert'
import type { Channel } from '@everynews/schema/channel'
import type { Subscription } from '@everynews/schema/subscription'
import { Settings } from 'lucide-react'
import { useState } from 'react'
import { ManageAlertSubscriptions } from './manage-alert-subscriptions'

export const SubscribeAlertDropdownItem = ({
  alert,
  channels,
  subscriptions,
  user,
}: {
  alert: Alert
  channels: Channel[]
  subscriptions: Subscription[]
  user?: { id: string; email: string; createdAt: Date }
}) => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <DropdownMenuItem
        onSelect={(e) => {
          e.preventDefault()
          setOpen(true)
        }}
      >
        <Settings className='mr-2 size-4' />
        Manage Subscriptions
      </DropdownMenuItem>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='sm:max-w-lg'>
          <ManageAlertSubscriptions
            alert={alert}
            channels={channels}
            subscriptions={subscriptions}
            user={user}
            isOwner={false}
            asDialog={false}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
