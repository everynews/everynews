import {
  Body,
  Button,
  Container,
  Img,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components'

const ChannelVerificationEmail = ({
  channelName,
  verificationLink,
}: {
  channelName: string
  verificationLink: string
}) => {
  return (
    <Tailwind>
      <Body className='bg-white px-2 font-sans'>
        <Preview>Verify your notification channel</Preview>
        <Container className='my-10 mx-auto rounded border border-gray-200 p-5 text-center'>
          <Link href={verificationLink} className='text-blue-600 no-underline'>
            <Section className='my-8 flex justify-center'>
              <Img
                src='https://every.news/logo.png'
                width='128'
                height='128'
                alt='every.news Logo'
              />
            </Section>
            <Text className='text-2xl font-bold text-gray-900 mb-4'>
              Verify Your Channel
            </Text>
            <Text className='text-lg text-gray-700 mb-6'>
              Please verify your email channel "{channelName}" to start
              receiving newsletters.
            </Text>
            <div className='flex justify-center'>
              <Button
                className='mx-auto rounded bg-black px-6 py-3 text-lg font-semibold text-white'
                href={verificationLink}
              >
                Verify Email Channel
              </Button>
            </div>
          </Link>
          <Text className='text-sm text-gray-500 mt-6'>
            If you did not create this channel, please ignore this email.
          </Text>
          <Text className='text-xs text-gray-400 mt-2'>
            This verification link will expire in 24 hours.
          </Text>
        </Container>
      </Body>
    </Tailwind>
  )
}

ChannelVerificationEmail.PreviewProps = {
  channelName: 'Daily Tech Updates',
  verificationLink: 'https://every.news/channels/verify/abc123',
}

export default ChannelVerificationEmail
