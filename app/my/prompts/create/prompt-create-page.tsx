'use client'

import { api } from '@everynews/app/api'
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
import { Textarea } from '@everynews/components/ui/textarea'
import { toastNetworkError } from '@everynews/lib/error'
import { ArrowLeft, Loader2, Plus, TestTube } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useId, useState } from 'react'
import { toast } from 'sonner'

type TestResult = {
  title: string
  keyFindings: string[]
  url: string
  originalTitle: string
}

export const PromptCreatePage = () => {
  const router = useRouter()
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [testUrl, setTestUrl] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [defaultPromptContent, setDefaultPromptContent] = useState('')
  
  const nameId = useId()
  const contentId = useId()
  const testUrlId = useId()

  useEffect(() => {
    fetch('/default-prompt.txt')
      .then((res) => res.text())
      .then((text) => {
        setDefaultPromptContent(text)
        setContent(text)
      })
      .catch(() => {
        const fallback = 'Enter your prompt instructions here...'
        setDefaultPromptContent(fallback)
        setContent(fallback)
      })
  }, [])

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
        json: { name: name.trim(), content: content.trim() },
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
      // First create the prompt temporarily to test it
      const createRes = await api.prompts.$post({
        json: { name: name.trim(), content: content.trim() },
      })

      if (!createRes.ok) {
        toast.error('Failed to create prompt for testing')
        return
      }

      const prompt = await createRes.json()

      // Then test it
      const testRes = await api.prompts.test.$post({
        json: {
          promptId: prompt.id,
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
        <Card>
          <CardHeader>
            <CardTitle>Prompt Details</CardTitle>
          </CardHeader>
          <CardContent className='space-y-6'>
            <div className='grid gap-2'>
              <Label htmlFor={nameId}>Prompt Name</Label>
              <Input
                id={nameId}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='My Custom Prompt'
              />
            </div>
            
            <div className='grid gap-2'>
              <Label htmlFor={contentId}>Prompt Instructions</Label>
              <p className='text-muted-foreground text-sm'>
                The AI will use <code>&lt;TITLE&gt;</code> and{' '}
                <code>&lt;KEYFINDING&gt;</code> tags for structured output.
              </p>
              <Textarea
                id={contentId}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={defaultPromptContent}
                className='min-h-48'
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <TestTube className='size-5' />
              Test This Prompt
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-6'>
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
              disabled={isLoading || !testUrl.trim() || !name.trim() || !content.trim()}
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
            <CardContent className='space-y-4'>
              <div>
                <h3 className='font-semibold text-lg mb-2'>
                  {testResult.title}
                </h3>
              </div>

              <Separator />

              <div>
                <ul className='space-y-2'>
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