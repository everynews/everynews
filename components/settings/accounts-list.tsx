import { Badge } from '@everynews/components/ui/badge'
import { Card } from '@everynews/components/ui/card'
import { format } from 'date-fns'

interface AccountsListProps {
  accounts: Array<{
    id: string
    userId: string
    providerId: string
    createdAt: Date
    updatedAt: Date
  }>
}

export const AccountsList = ({ accounts }: AccountsListProps) => {
  if (accounts.length === 0) {
    return (
      <p className='text-sm text-muted-foreground'>
        No connected accounts found. You're using magic link authentication.
      </p>
    )
  }

  return (
    <div className='space-y-2'>
      {accounts.map((account) => (
        <Card key={account.id} className='p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='font-medium capitalize'>{account.providerId}</p>
              <p className='text-sm text-muted-foreground'>
                Connected on {format(account.createdAt, 'PPP')}
              </p>
            </div>
            <Badge variant='secondary'>Connected</Badge>
          </div>
        </Card>
      ))}
    </div>
  )
}
