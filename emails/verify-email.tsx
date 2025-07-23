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

interface VerifyEmailProps {
  verificationLink: string
}

const baseUrl = process.env.PRODUCT_URL
  ? `https://${process.env.PRODUCT_URL}`
  : 'https://every.news'

const VerifyEmail = ({
  verificationLink = 'https://every.news/verify-email?token=example',
}: VerifyEmailProps) => {
  const previewText = 'Verify your email address for Everynews'

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
              Welcome to Everynews!
            </Text>
            <Text className='text-black text-[14px] leading-[24px]'>
              Please verify your email address by clicking the button below.
              This helps us ensure that you own this email address and can
              receive important notifications.
            </Text>
            <Section className='text-center mt-[32px] mb-[32px]'>
              <Button
                className='bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3'
                href={verificationLink}
              >
                Verify Email Address
              </Button>
            </Section>
            <Hr className='border border-solid border-[#eaeaea] my-[26px] mx-0 w-full' />
            <Text className='text-[#666666] text-[12px] leading-[24px]'>
              If you didn't create an account with Everynews, you can safely
              ignore this email.
            </Text>
          </Container>
        </body>
      </Tailwind>
    </Html>
  )
}

export default VerifyEmail
