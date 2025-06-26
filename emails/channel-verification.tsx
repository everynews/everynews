import {
  Body,
  Button,
  Container,
  Link,
  Preview,
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
          <Link
            href={verificationLink}
            className='text-orange-600 no-underline'
          >
            <div className='flex justify-center'>
              <Button
                className='mx-auto rounded bg-black px-6 py-3 text-lg font-semibold text-white'
                href={verificationLink}
              >
                Verify "{channelName}"
              </Button>
            </div>
          </Link>
          <Text className='text-sm text-gray-500 mt-6'>
            If you did not create this channel, please ignore this email.
          </Text>
          <Text className='text-xs text-gray-400 mt-2'>
            This verification link will expire in 5 minutes.
          </Text>
        </Container>
      </Body>
    </Tailwind>
  )
}

ChannelVerificationEmail.PreviewProps = {
  channelName: '이메일',
  verificationLink: 'https://every.news/verify/channel/abc123',
}

export default ChannelVerificationEmail
