import { Button } from '@everynews/components/ui/button'
import { FormLabel } from '@everynews/components/ui/form'
import { Input } from '@everynews/components/ui/input'

interface VerificationSectionProps {
  showVerificationInput: boolean
  verificationCode: string
  setVerificationCode: (code: string) => void
  onSendVerification: () => void
  onVerifyCode: () => void
  isLoading?: boolean
}

export const VerificationSection = ({
  showVerificationInput,
  verificationCode,
  setVerificationCode,
  onSendVerification,
  onVerifyCode,
  isLoading = false,
}: VerificationSectionProps) => {
  if (!showVerificationInput) {
    return (
      <Button
        type='button'
        variant='outline'
        onClick={onSendVerification}
        disabled={isLoading}
        className='w-full'
      >
        Send Verification Code
      </Button>
    )
  }

  return (
    <div className='space-y-2'>
      <FormLabel>Verification Code</FormLabel>
      <div className='flex gap-2'>
        <Input
          placeholder='Enter 6-digit code'
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value)}
          maxLength={6}
        />
        <Button
          type='button'
          onClick={onVerifyCode}
          disabled={verificationCode.length !== 6 || isLoading}
        >
          Verify
        </Button>
      </div>
      <p className='text-xs text-muted-foreground'>
        Check your email or SMS for the verification code
      </p>
    </div>
  )
}
