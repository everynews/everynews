import {
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components'

interface PasswordResetEmailProps {
  resetLink: string
}

const baseUrl = process.env.PRODUCT_URL
  ? `https://${process.env.PRODUCT_URL}`
  : 'https://every.news'

const PasswordResetEmail = ({
  resetLink = 'https://every.news/reset-password?token=example',
}: PasswordResetEmailProps) => {
  const previewText = 'Reset your password for Everynews'

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <body className='bg-white my-auto mx-auto font-sans'>
          <Container className='border border-solid border-[#eaeaea] rounded my-10 mx-auto p-5 w-[465px]'>
            <Section className='mt-8'>
              <Img
                src={`${baseUrl}/logo.png`}
                width='40'
                height='37'
                alt='Everynews'
                className='my-0 mx-auto'
              />
            </Section>
            <Text className='text-black text-[14px] leading-[24px]'>
              Hello,
            </Text>
            <Text className='text-black text-[14px] leading-[24px]'>
              We received a request to reset your password for your Everynews
              account. If you didn't make this request, you can safely ignore
              this email.
            </Text>
            <Section className='text-center mt-[32px] mb-[32px]'>
              <Button
                className='bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3'
                href={resetLink}
              >
                Reset Password
              </Button>
            </Section>
            <Hr className='border border-solid border-[#eaeaea] my-[26px] mx-0 w-full' />
            <Text className='text-[#666666] text-[12px] leading-[24px]'>
              This email was sent to you because someone requested a password
              reset for your account. If you didn't request this, please ignore
              this email or contact support if you have concerns.
            </Text>
          </Container>
        </body>
      </Tailwind>
    </Html>
  )
}

export default PasswordResetEmail
