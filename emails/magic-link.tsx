import {
  Body,
  Button,
  Container,
  Link,
  Preview,
  Tailwind,
  Text,
} from '@react-email/components'

const MagicLinkEmail = ({ loginLink }: { loginLink: string }) => {
  return (
    <Tailwind>
      <Body className='bg-white px-2 font-sans'>
        <Preview>Verify your notification channel</Preview>
        <Container className='my-10 mx-auto rounded border border-gray-200 p-5 text-center'>
          <Link href={loginLink} className='text-blue-600 no-underline'>
            <div className='flex justify-center'>
              <Button
                className='mx-auto rounded bg-black px-6 py-3 text-lg font-semibold text-white'
                href={loginLink}
              >
                Sign In
              </Button>
            </div>
          </Link>
          <Text className='text-sm text-gray-500 mt-6'>
            If you did not request this sign in, please ignore this email.
          </Text>
          <Text className='text-xs text-gray-400 mt-2'>
            This sign in link will expire in 5 minutes.
          </Text>
        </Container>
      </Body>
    </Tailwind>
  )
}

MagicLinkEmail.PreviewProps = {
  loginLink: 'https://every.news/sign-in',
}

export default MagicLinkEmail
