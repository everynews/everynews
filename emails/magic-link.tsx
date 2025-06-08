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

const MagicLinkEmail = ({ loginLink }: { loginLink: string }) => {
  return (
      <Tailwind>
        <Body className='bg-white px-2 font-sans'>
          <Preview>Sign in with magic link</Preview>
          <Container className='my-10 mx-auto rounded border border-gray-200 p-5 text-center'>
            <Link href={loginLink} className='text-blue-600 no-underline'>
              <Section className='my-8 flex justify-center'>
                <Img
                  src='https://every.news/logo.png'
                  width='128'
                  height='128'
                  alt='every.news Logo'
                />
              </Section>
              <div className='flex justify-center'>
                <Button
                  className='mx-auto rounded bg-black px-4 py-2 text-lg font-semibold text-white'
                  href={loginLink}
                >
                  Sign in to every.news
                </Button>
              </div>
            </Link>
            <Text className='text-sm text-center'>
              If you did not request this, please ignore this email.
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
