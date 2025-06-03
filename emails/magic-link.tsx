import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components';

const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : '';

export const MagicLinkEmail = ({
  loginLink,
}: {
  loginLink: string;
}) => { 
  return (
    <Html>
      <Head />
      <Tailwind>
        <Body className="mx-auto my-auto bg-white px-2 font-sans text-center">
          <Preview>Sign in with magic link</Preview>
          <Container className="mx-auto my-10 max-w-md rounded border border-gray-200 p-5">
            <Section className="mt-8">
              <Img
                src={`${baseUrl}/logo.png`}
                width="40"
                height="37"
                alt="Everynews Logo"
                className="mx-auto"
              />
            </Section>
              <Link
                href={loginLink}
                className="text-blue-600 no-underline"
              >
                <Button
                  className="rounded bg-black px-4 py-2 text-lg font-semibold text-white"
                  href={loginLink}
                >
                  Sign in to Everynews
                </Button>
              </Link>

              <Text className="text-sm text-black">
                If you did not request this, please ignore this email.
              </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

MagicLinkEmail.PreviewProps = {
  loginLink: 'https://every.news/sign-in',
};

export default MagicLinkEmail;
