import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components'

interface SubscriptionConfirmationEmailProps {
  url: string
  alertName: string
}

export const SubscriptionConfirmationEmail = ({
  url,
  alertName,
}: SubscriptionConfirmationEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Confirm your subscription to {alertName}</Preview>
      <Tailwind
        config={{
          theme: {
            extend: {
              colors: {
                brand: '#ff6b35',
              },
            },
          },
        }}
      >
        <Body className='bg-gray-100 font-sans'>
          <Container className='mx-auto my-[40px] max-w-[600px] rounded-lg bg-white p-[40px] shadow-lg'>
            <Section className='text-center'>
              <Text className='text-[24px] font-bold text-gray-900'>
                Confirm Your Subscription
              </Text>
              <Text className='mt-[16px] text-[16px] text-gray-600'>
                Click below to confirm your subscription to{' '}
                <strong>{alertName}</strong> and start receiving updates.
              </Text>
              <Button
                href={url}
                className='mt-[32px] inline-block rounded-md bg-brand px-[32px] py-[12px] text-[16px] font-semibold text-white no-underline'
              >
                Confirm Subscription
              </Button>
              <Text className='mt-[24px] text-[14px] text-gray-500'>
                This link will expire in 5 minutes for security reasons.
              </Text>
              <Text className='mt-[16px] text-[12px] text-gray-400'>
                If you didn't request this subscription, you can safely ignore
                this email.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

export default SubscriptionConfirmationEmail
