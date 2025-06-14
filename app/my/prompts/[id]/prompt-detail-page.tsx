'use client'

import { api } from '@everynews/app/api'
import { PromptDialog } from '@everynews/components/prompt-dialog'
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
import type { Prompt } from '@everynews/schema/prompt'
import { ArrowLeft, Edit, Loader2, TestTube } from 'lucide-react'
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

export const PromptDetailPage = ({ prompt }: { prompt: Prompt }) => {
  const router = useRouter()
  const [testUrl, setTestUrl] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const testUrlId = useId()

  const handleTest = async () => {
    if (!testUrl.trim()) {
      toast.error('Please enter a URL to test')
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
      const res = await api.prompts.test.$post({
        json: {
          promptId: prompt.id,
          url: testUrl,
        },
      })

      if (!res.ok) {
        const error = await res.text()
        toast.error(`Test failed: ${error}`)
        return
      }

      const result = await res.json()
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
          <h1 className='text-3xl font-bold'>{prompt.name}</h1>
          <p className='text-muted-foreground mt-2'>
            Created {new Date(prompt.createdAt).toLocaleDateString()} • Updated{' '}
            {new Date(prompt.updatedAt).toLocaleDateString()}
          </p>
        </div>
        <PromptDialog
          mode='edit'
          original={prompt}
          onSuccess={() => router.refresh()}
          trigger={
            <Button variant='outline'>
              <Edit className='size-4 mr-2' />
              Edit Prompt
            </Button>
          }
        />
      </div>

      <div className='grid gap-8'>
        <Card>
          <CardHeader>
            <CardTitle>Prompt Content</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='bg-muted p-4 rounded-lg'>
              <pre className='whitespace-pre-wrap text-sm'>
                {prompt.content}
              </pre>
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
              disabled={isLoading || !testUrl.trim()}
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
                <h4 className='font-medium mb-3'>Key Findings:</h4>
                <ul className='space-y-2'>
                  {testResult.keyFindings.map((finding) => (
                    <li key={finding} className='flex items-start gap-2'>
                      <span className='text-muted-foreground mt-1'>•</span>
                      <span>{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Separator />

              <div className='text-sm text-muted-foreground'>
                <a
                  href={testResult.url}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='hover:underline'
                >
                  Source: {testResult.url}
                </a>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
