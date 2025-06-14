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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@everynews/components/ui/select'
import { Separator } from '@everynews/components/ui/separator'
import { Textarea } from '@everynews/components/ui/textarea'
import { toastNetworkError } from '@everynews/lib/error'
import type { Prompt } from '@everynews/schema/prompt'
import { LANGUAGE_LABELS, SUPPORTED_LANGUAGES } from '@everynews/schema/prompt'
import { ArrowLeft, Loader2, Save, TestTube } from 'lucide-react'
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
  const [name, setName] = useState(prompt.name)
  const [content, setContent] = useState(prompt.content)
  const [language, setLanguage] = useState(prompt.language || 'en')
  const [isSaving, setIsSaving] = useState(false)
  const testUrlId = useId()
  const nameId = useId()
  const contentId = useId()
  const languageId = useId()

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Please enter a prompt name')
      return
    }

    if (!content.trim()) {
      toast.error('Please enter prompt content')
      return
    }

    setIsSaving(true)

    try {
      const res = await api.prompts[':id'].$put({
        json: { content: content.trim(), language, name: name.trim() },
        param: { id: prompt.id },
      })

      if (!res.ok) {
        toast.error('Failed to save prompt')
        return
      }

      toast.success('Prompt saved successfully')
      router.refresh()
    } catch (error) {
      toastNetworkError(error as Error)
    } finally {
      setIsSaving(false)
    }
  }

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
          <h1 className='text-3xl font-bold'>{name}</h1>
          <p className='text-muted-foreground mt-2'>
            Created {new Date(prompt.createdAt).toLocaleDateString()} • Updated{' '}
            {new Date(prompt.updatedAt).toLocaleDateString()}
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className='size-4 animate-spin mr-2' />
              Saving...
            </>
          ) : (
            <>
              <Save className='size-4 mr-2' />
              Save
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
              <Label htmlFor={languageId}>Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger id={languageId}>
                  <SelectValue placeholder='Select language' />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {LANGUAGE_LABELS[lang]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                placeholder='Enter your prompt instructions here...'
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
