import type { Story } from '@everynews/schema'
import {
  Body,
  Container,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
} from '@react-email/components'

export const Alert = ({ stories }: { stories: Story[] }) => {
  return (
    <Html lang='en' dir='ltr'>
      <Preview>{stories[0]?.keyFindings?.join(' ') ?? ''}</Preview>
      <Tailwind>
        <Body>
          <Container className='max-w-2xl mx-auto p-1 font-sans'>
            <Section>
              {stories && stories.length > 0 ? (
                <div>
                  {stories.map((story) => (
                    <div key={story.id}>
                      <Link
                        href={story.originalUrl}
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
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

Alert.PreviewProps = {
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
}
