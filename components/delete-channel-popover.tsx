'use client'

import { api } from '@everynews/app/api'
import { DeletePopover } from '@everynews/components/delete-popover'
import type { Channel } from '@everynews/schema/channel'
import { useRouter } from 'next/navigation'

export const DeleteChannelPopover = ({
  channel,
  children,
}: {
  channel: Channel
  children?: React.ReactNode
}) => {
  const router = useRouter()

  const handleDelete = async () => {
    await api.channels[':id'].$delete({
      param: { id: channel.id },
    })
    router.refresh()
  }

  return (
    <DeletePopover
      itemName={channel.name}
      onDelete={handleDelete}
      successMessage='Channel deleted successfully'
    >
      {children}
    </DeletePopover>
  )
}
