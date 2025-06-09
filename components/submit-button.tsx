import { Button } from '@everynews/components/ui/button'
import { cn } from '@everynews/lib/utils'
import { Loader2 } from 'lucide-react'

interface SubmitButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  onClick: () => void
  loading: boolean
  children: React.ReactNode
  disabled?: boolean
  className?: string
}

export const SubmitButton = ({
  onClick,
  loading,
  children,
  variant,
  size,
  disabled,
  className,
}: SubmitButtonProps) => (
  <Button
    variant={variant}
    size={size}
    onClick={onClick}
    disabled={loading || disabled}
    className={cn('gap-0', className)}
  >
    {children}
    <Loader2
      className={cn(
        'block transition-all',
        !loading ? 'ml-0 size-0' : 'ml-1 size-4 animate-spin',
      )}
    />
  </Button>
)
