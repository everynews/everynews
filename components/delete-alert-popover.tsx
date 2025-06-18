'use client'

import { api } from '@everynews/app/api'
import { DeletePopover } from '@everynews/components/delete-popover'
import type { Alert } from '@everynews/schema/alert'
import { useRouter } from 'next/navigation'

export const DeleteAlertPopover = ({
  alert,
  children,
}: {
  alert: Alert
  children?: React.ReactNode
}) => {
  const router = useRouter()

  const handleDelete = async () => {
    await api.alerts[':id'].$delete({
      param: { id: alert.id },
    })
    router.refresh()
  }

  return (
    <DeletePopover
      itemName={alert.name}
      onDelete={handleDelete}
      successMessage='Alert deleted successfully'
    >
      {children}
    </DeletePopover>
  )
}
