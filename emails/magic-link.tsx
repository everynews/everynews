import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components'

const MagicLinkEmail = ({ loginLink }: { loginLink: string }) => {
  return (
    <Html>
      <Head />
      <Tailwind>
        <Body className='mx-auto my-auto bg-white px-2 font-sans text-center'>
          <Preview>Sign in with magic link</Preview>
          <Container className='mx-auto my-10 max-w-md rounded border border-gray-200 p-5'>
            <Link href={loginLink} className='text-blue-600 no-underline'>
            <Section className='my-8'>
              <Img
                src='https://every.news/logo.png'
                width='128'
                height='128'
                alt='Everynews Logo'
                className='mx-auto'
              />
            </Section>
              <Button
                className='rounded bg-black px-4 py-2 text-lg font-semibold text-white'
                href={loginLink}
              >
                Sign in to Everynews
              </Button>
            </Link>

            <Text className='text-sm'>
              If you did not request this, please ignore this email.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

MagicLinkEmail.PreviewProps = {
  loginLink: 'https://every.news/sign-in',
}

export default MagicLinkEmail
