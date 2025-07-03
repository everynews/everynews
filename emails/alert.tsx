import { formatSchedule } from '@everynews/lib/format-schedule'
import { url } from '@everynews/lib/url'
import type { Story, Strategy, Wait } from '@everynews/schema'
import {
  Body,
  Container,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components'

const Alert = ({
  alertName,
  readerCount,
  stories,
  strategy,
  subscriptionId,
  wait,
}: {
  alertName: string
  readerCount: number
  stories: Story[]
  strategy: Strategy
  subscriptionId?: string
  wait: Wait
}) => {
  return (
    <Html lang='en' dir='ltr'>
      <Preview>{stories[0]?.keyFindings?.join(' ') ?? ''}</Preview>
      <Tailwind>
        <Body>
          <Container className='max-w-2xl mx-auto p-0.5 font-sans'>
            <Section>
              <Heading as='h1' className='block text-xl font-bold my-0.5'>
                {alertName}
              </Heading>

              <Text className='block text-xs text-gray-500 my-0.5'>
                Using{' '}
                {strategy.provider === 'hnbest'
                  ? 'Hacker News Best'
                  : strategy.provider === 'google'
                    ? 'Google Search'
                    : 'Unknown Data Source'}{' '}
                ·{' '}
                {wait.type === 'count'
                  ? `after ${wait.value} stories`
                  : formatSchedule(wait.value)}{' '}
                · {readerCount} {readerCount !== 1 ? 'readers' : 'reader'}
              </Text>
            </Section>
            {stories?.length ? (
              <Section>
                {stories.map((story) => (
                  <div key={story.id} className='block'>
                    <Link
                      href={`${url}/stories/${story.id}`}
                      className='block text-orange-500 no-underline'
                    >
                      <Heading as='h2' className='block text-lg font-semibold'>
                        {story.title}
                      </Heading>
                    </Link>

                    {story.keyFindings?.length ? (
                      <ul className='text-gray-700 list-disc pl-4 leading-relaxed'>
                        {story.keyFindings.map((finding) => (
                          <li key={finding}>{finding}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ))}
              </Section>
            ) : null}
            {subscriptionId ? (
              <Section className='mt-4 pt-2 border-t border-gray-200'>
                <Text className='block text-xs text-gray-500 text-center my-0.5'>
                  <Link
                    href={`${url}/unsubscribe/${subscriptionId}`}
                    className='text-gray-500 underline'
                  >
                    Unsubscribe
                  </Link>
                </Text>
              </Section>
            ) : null}
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

Alert.PreviewProps = {
  alertName: 'Tech Digest',
  readerCount: 123,
  stories: [
    {
      alertId: '6JTQMD8N8BMD',
      contentId: 'CMR4XRW20ECJ',
      createdAt: new Date('2025-06-04T08:40:24.919Z'),
      id: '00AK3NF069VT',
      keyFindings: [
        'AI-generated summaries often provide incorrect information due to hallucination.',
        'Repeated queries result in varying and mostly incorrect AI responses.',
        'Only ~10 % of the time does AI produce a correct answer.',
        "AI's inability to acknowledge uncertainty undermines its utility in research.",
      ],
      title: 'AI Inaccuracies in IBM PS/2 Model Identification',
      updatedAt: new Date('2025-06-04T08:40:24.919Z'),
      url: 'https://os2museum.com/wp/ai-responses-may-include-mistakes',
    },
    {
      alertId: '6JTQMD8N8BMD',
      contentId: '1B2N47W0FXJB',
      createdAt: new Date('2025-06-04T08:40:36.233Z'),
      id: '0738HMRMVS00',
      keyFindings: [
        'LLM 0.26 lets language models run tools via a terminal-style interface.',
        'Plugins can now be installed to enhance model capabilities.',
        'Synchronous and async tool execution is supported.',
        'New plugins enable math calculations and SQL queries.',
        'A unified abstraction layer allows multiple models to share tools.',
      ],
      title: 'LLM 0.26 Enables Terminal Tool Integration for Language Models',
      updatedAt: new Date('2025-06-04T08:40:36.233Z'),
      url: 'https://simonwillison.net/2025/May/27/llm-tools',
    },
  ],
  strategy: {
    provider: 'google',
    query: 'latest tech news',
  },
  subscriptionId: 'test-subscription-id',
  wait: { type: 'schedule', value: '0 0 * * *' },
}

export default Alert
