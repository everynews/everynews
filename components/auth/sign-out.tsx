'use client'
import { auth } from '@everynews/auth/client'
import { DropdownMenuItem } from '@everynews/components/ui/dropdown-menu'
import { useRouter } from 'next/navigation'

export const DropdownSignOut = () => {
  const router = useRouter()
  return (
    <DropdownMenuItem
      onClick={async () =>
        await auth.signOut({
          fetchOptions: {
            onSuccess: () => {
              router.push('/')
            },
          },
        })
      }
    >
      Sign Out
    </DropdownMenuItem>
  )
}
