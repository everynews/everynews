import { url } from '@everynews/lib/url'
import type { Story, Strategy, WaitSchema } from '@everynews/schema'
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
import type { z } from 'zod'

type Wait = z.infer<typeof WaitSchema>

export const Alert = ({
  alertName,
  readerCount,
  stories,
  strategy,
  wait,
}: {
  alertName: string
  readerCount: number
  stories: Story[]
  strategy: Strategy
  wait: Wait
}) => {
  return (
    <Html lang='en' dir='ltr'>
      <Preview>{stories[0]?.keyFindings?.join(' ') ?? ''}</Preview>
      <Tailwind>
        <Body>
          <Container className='max-w-2xl mx-auto p-1 font-sans'>
            <Section>
              <div className='flex flex-col gap-2'>
                <div className='flex flex-col gap-1'>
                  <Heading as='h1' className='text-xl font-bold'>
                    {alertName}
                  </Heading>
                  <Text className='text-xs text-gray-500'>
                    {strategy.provider} ·{' '}
                    {wait.type === 'count'
                      ? `after ${wait.value} stories`
                      : wait.value}{' '}
                    · {readerCount} readers
                  </Text>
                </div>
                {stories && stories.length > 0 ? (
                  <div className='flex flex-col gap-1'>
                    {stories.map((story) => (
                      <div key={story.id}>
                        <Link
                          href={`${url}/stories/${story.id}`}
                          className='text-orange-500 no-underline'
                        >
                          <Heading as='h2' className='text-lg font-semibold'>
                            {story.title}
                          </Heading>
                        </Link>
                        {story.keyFindings && story.keyFindings.length > 0 && (
                          <ul className='text-gray-700 list-disc pl-4 leading-relaxed'>
                            {story.keyFindings.map((finding) => (
                              <li key={finding}>{finding}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </Section>
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
        'AI-generated summaries often provide incorrect information due to hallucination, creating plausible but false details about the IBM PS/2 Model 280.',
        'Repeated queries result in varying and mostly incorrect AI responses, highlighting the lack of reliability in AI-generated data when searching for accurate historical tech information.',
        'Approximately 10% of the time, AI eventually gives a correct answer, indicating inconsistency and the potential for misleading non-expert users.',
        "AI's inability to acknowledge uncertainty undermines its utility in research, as it generates responses based on statistical likelihood without contextual understanding.",
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
        'LLM 0.26 introduces the ability for language models to run tools via terminal, using Python functions.',
        'Tool plugins can now be installed to enhance model capabilities, with support for OpenAI, Gemini, and others.',
        'Both synchronous and asynchronous tool execution is supported within the Python API and command line interface.',
        'New plugins enable mathematical calculations and SQL query execution through sandboxed environments.',
        "LLM's design enhances tool integration by accommodating multiple models and adopting a unified abstraction layer.",
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
  wait: { type: 'schedule', value: '0 0 * * *' },
}
