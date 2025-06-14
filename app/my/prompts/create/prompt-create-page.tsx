'use client'

import { api } from '@everynews/app/api'
import { PromptDetailsCard } from '@everynews/components/prompt-details-card'
import { Button } from '@everynews/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@everynews/components/ui/card'
import { Input } from '@everynews/components/ui/input'
import { Label } from '@everynews/components/ui/label'
import { Separator } from '@everynews/components/ui/separator'
import { toastNetworkError } from '@everynews/lib/error'
import { DEFAULT_PROMPT_PLACEHOLDER } from '@everynews/lib/prompts'
import type { LanguageCode } from '@everynews/schema/language'
import { humanId } from 'human-id'
import { ArrowLeft, Loader2, Plus, TestTube } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useId, useState } from 'react'
import { toast } from 'sonner'

type TestResult = {
  title: string
  keyFindings: string[]
  url: string
  originalTitle: string
}

export const PromptCreatePage = ({
  defaultPromptContent,
}: {
  defaultPromptContent: string
}) => {
  const router = useRouter()
  const [name, setName] = useState(
    humanId({ capitalize: true, separator: ' ' }),
  )
  const [content, setContent] = useState(defaultPromptContent)
  const [language, setLanguage] = useState<LanguageCode>('en')
  const [testUrl, setTestUrl] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)

  const nameId = useId()
  const contentId = useId()
  const languageId = useId()
  const testUrlId = useId()

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Please enter a prompt name')
      return
    }

    if (!content.trim()) {
      toast.error('Please enter prompt content')
      return
    }

    setIsCreating(true)

    try {
      const res = await api.prompts.$post({
        json: { content: content.trim(), language, name: name.trim() },
      })

      if (!res.ok) {
        toast.error('Failed to create prompt')
        return
      }

      const prompt = await res.json()
      toast.success('Prompt created successfully')
      router.push(`/my/prompts/${prompt.id}`)
    } catch (error) {
      toastNetworkError(error as Error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleTest = async () => {
    if (!testUrl.trim()) {
      toast.error('Please enter a URL to test')
      return
    }

    if (!name.trim() || !content.trim()) {
      toast.error('Please fill in prompt name and content before testing')
      return
    }

    // Basic URL validation
    try {
      new URL(testUrl)
    } catch {
      toast.error('Please enter a valid URL')
      return
    }

    setIsLoading(true)
    setTestResult(null)

    try {
      const testRes = await api.prompts.test.$post({
        json: {
          promptContent: content.trim(),
          url: testUrl,
        },
      })

      if (!testRes.ok) {
        const error = await testRes.text()
        toast.error(`Test failed: ${error}`)
        return
      }

      const result = await testRes.json()
      setTestResult(result)
      toast.success('Prompt test completed')
    } catch (error) {
      toastNetworkError(error as Error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='container mx-auto max-w-4xl'>
      <div className='flex items-center gap-4 mb-8'>
        <Button asChild variant='ghost' size='sm'>
          <Link href='/my/prompts'>
            <ArrowLeft className='size-4 mr-2' />
            Back to Prompts
          </Link>
        </Button>
      </div>

      <div className='flex items-center justify-between mb-8'>
        <div>
          <h1 className='text-3xl font-bold'>Create New Prompt</h1>
          <p className='text-muted-foreground mt-2'>
            Create a custom AI prompt for newsletter summarization
          </p>
        </div>
        <Button onClick={handleCreate} disabled={isCreating}>
          {isCreating ? (
            <>
              <Loader2 className='size-4 animate-spin mr-2' />
              Creating...
            </>
          ) : (
            <>
              <Plus className='size-4 mr-2' />
              Create Prompt
            </>
          )}
        </Button>
      </div>

      <div className='grid gap-8'>
        <PromptDetailsCard
          name={name}
          language={language}
          content={content}
          onNameChange={setName}
          onLanguageChange={setLanguage}
          onContentChange={setContent}
          nameId={nameId}
          languageId={languageId}
          contentId={contentId}
          contentPlaceholder={DEFAULT_PROMPT_PLACEHOLDER}
        />

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <TestTube className='size-5' />
              Test This Prompt
            </CardTitle>
          </CardHeader>
          <CardContent className='grid gap-6'>
            <div className='grid gap-2'>
              <Label htmlFor={testUrlId}>Article URL</Label>
              <Input
                id={testUrlId}
                placeholder='https://example.com/article'
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <Button
              onClick={handleTest}
              disabled={
                isLoading || !testUrl.trim() || !name.trim() || !content.trim()
              }
            >
              {isLoading ? (
                <>
                  <Loader2 className='size-4 animate-spin mr-2' />
                  Processing...
                </>
              ) : (
                <>
                  <TestTube className='size-4 mr-2' />
                  Test Prompt
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {testResult && (
          <Card>
            <CardHeader>
              <CardTitle>Test Result</CardTitle>
              <p className='text-sm text-muted-foreground'>
                Original: {testResult.originalTitle}
              </p>
            </CardHeader>
            <CardContent className='grid gap-4'>
              <div>
                <h3 className='font-semibold text-lg mb-2'>
                  {testResult.title}
                </h3>
              </div>

              <Separator />

              <div>
                <ul className='flex flex-col gap-2'>
                  {testResult.keyFindings.map((finding) => (
                    <li key={finding} className='flex items-start gap-2'>
                      <span className='text-muted-foreground mt-1'>•</span>
                      <span>{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
