import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components'

interface AlertInvitationEmailProps {
  inviterName: string
  inviterEmail: string
  inviterImage?: string | null
  alertName: string
  alertDescription?: string | null
  message?: string | null
  invitationUrl: string
  recentStories?: Array<{
    title: string
    keyFindings?: string[] | null
    createdAt: Date
  }>
}

const AlertInvitationEmail = ({
  inviterName,
  inviterEmail,
  inviterImage,
  alertName,
  alertDescription,
  message,
  invitationUrl,
  recentStories = [],
}: AlertInvitationEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>
        {inviterName} invited you to subscribe to {alertName}
      </Preview>
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
            <Section>
              <div className='flex items-center gap-4 mb-6'>
                {inviterImage && (
                  <Img
                    src={inviterImage}
                    alt={inviterName}
                    width='48'
                    height='48'
                    className='rounded-full'
                  />
                )}
              </div>
              <Text className='text-[16px] text-gray-700 m-0 font-bold text-center'>
                {inviterName} invited you to subscribe to
              </Text>
              <Heading className='text-[24px] text-gray-700 m-0 font-bold text-center mb-4'>
                {alertName}
              </Heading>
              {alertDescription && (
                <Text className='text-[14px] text-gray-600 text-center m-0 mb-4'>
                  {alertDescription}
                </Text>
              )}

              {message && (
                <div className='bg-gray-50 rounded-md p-4 mb-6'>
                  <Text className='text-[16px] text-gray-700 m-0'>
                    {message}
                  </Text>
                </div>
              )}

              {recentStories.length > 0 && (
                <>
                  <Text className='text-[16px] font-semibold text-gray-900 mb-4'>
                    Recent Stories
                  </Text>
                  <div className='space-y-4'>
                    {recentStories.slice(0, 3).map((story) => (
                      <div
                        key={story.title}
                        className='border border-gray-200 rounded-md p-4'
                      >
                        <Text className='text-[14px] font-medium text-gray-900 m-0 mb-2'>
                          {story.title}
                        </Text>
                        {story.keyFindings && story.keyFindings.length > 0 && (
                          <Text className='text-[12px] text-gray-600 m-0'>
                            {story.keyFindings.slice(0, 3).join(' ')}
                          </Text>
                        )}
                        <Text className='text-[12px] text-gray-500 m-0 mt-2'>
                          {story.createdAt.toLocaleDateString('en-US', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </Text>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <Section className='text-center mt-8'>
                <Button
                  href={invitationUrl}
                  className='inline-block rounded-md bg-brand px-[32px] py-[12px] text-[16px] font-semibold text-white no-underline'
                >
                  Accept Invitation
                </Button>
              </Section>

              <Text className='text-[12px] text-gray-500 text-center mt-6'>
                This invitation expires in 30 days. If you didn't expect this
                invitation from {inviterEmail}, you can safely ignore this
                email.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

AlertInvitationEmail.PreviewProps = {
  alertDescription: 'Latest technology news and updates',
  alertName: 'Tech News Daily',
  invitationUrl: 'https://every.news/invitations/token123',
  inviterEmail: 'john@example.com',
  inviterImage: 'https://via.placeholder.com/48',
  inviterName: 'John Doe',
  message: 'I think you would find this alert interesting!',
  recentStories: [
    {
      createdAt: new Date(),
      keyFindings: ['Revolutionary AI features', 'Available next month'],
      title: 'Breaking: Major Tech Company Announces New Product',
    },
    {
      createdAt: new Date(Date.now() - 86400000),
      keyFindings: ['Market expected to grow 20%', 'New players emerging'],
      title: 'Industry Analysis: The Future of Cloud Computing',
    },
  ],
}

export default AlertInvitationEmail
