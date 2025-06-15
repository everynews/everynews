'use client'

import { api } from '@everynews/app/api'
import { SubmitButton } from '@everynews/components/submit-button'
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
import { Textarea } from '@everynews/components/ui/textarea'
import { Alert } from '@everynews/emails/alert'
import { toastNetworkError } from '@everynews/lib/error'
import type { Story } from '@everynews/schema'
import type { Prompt } from '@everynews/schema/prompt'

type TestStory = Pick<Story, 'title' | 'keyFindings' | 'url'> & {
  originalTitle: string
}

import { useId, useState } from 'react'
import { toast } from 'sonner'

interface WorkbenchProps {
  prompts: Prompt[]
}

export const WorkbenchPage = ({ prompts }: WorkbenchProps) => {
  const [selectedPromptId, setSelectedPromptId] = useState(prompts[0]?.id || '')
  const [alertName, setAlertName] = useState('My Alert')
  const [urlsText, setUrlsText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [stories, setStories] = useState<TestStory[]>([])

  const handleTest = async () => {
    const urls = urlsText
      .split('\n')
      .map((u) => u.trim())
      .filter(Boolean)

    if (urls.length === 0) {
      toast.error('Please enter at least one URL')
      return
    }

    setIsLoading(true)
    const results: TestStory[] = []
    try {
      const promptContent =
        prompts.find((p) => p.id === selectedPromptId)?.content || ''

      for (const url of urls) {
        try {
          new URL(url)
        } catch {
          toast.error(`Invalid URL: ${url}`)
          continue
        }

        const res = await api.prompts.test.$post({
          json: { promptContent, url },
        })
        if (!res.ok) {
          const text = await res.text()
          toast.error(`Failed to summarize ${url}: ${text}`)
          continue
        }
        const data = (await res.json()) as TestStory
        results.push(data)
      }

      setStories(results)
      toast.success('Newsletter test completed')
    } catch (error) {
      toastNetworkError(error as Error)
    } finally {
      setIsLoading(false)
    }
  }

  const textareaId = useId()
  const alertNameId = useId()
  const promptSelectId = useId()

  return (
    <div className='container mx-auto max-w-6xl'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold'>Workbench</h1>
        <p className='text-muted-foreground mt-2'>
          Test your alerts with your prompts.
        </p>
      </div>

      <div className='grid md:grid-cols-2 gap-8'>
        <div className='grid gap-8'>
          <Card>
            <CardHeader>
              <CardTitle>Configure Test</CardTitle>
            </CardHeader>
            <CardContent className='grid gap-6'>
              <div className='grid gap-2'>
                <Label htmlFor={alertNameId}>Alert Name</Label>
                <Input
                  id={alertNameId}
                  value={alertName}
                  onChange={(e) => setAlertName(e.target.value)}
                />
              </div>

              <div className='grid gap-2'>
                <Label htmlFor={promptSelectId}>Prompt</Label>
                <Select
                  value={selectedPromptId}
                  onValueChange={(v) => setSelectedPromptId(v)}
                >
                  <SelectTrigger id={promptSelectId}>
                    <SelectValue placeholder='Select prompt' />
                  </SelectTrigger>
                  <SelectContent>
                    {prompts.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='grid gap-2'>
                <Label htmlFor={textareaId}>Article URLs (one per line)</Label>
                <Textarea
                  id={textareaId}
                  placeholder='https://example.com/article'
                  value={urlsText}
                  onChange={(e) => setUrlsText(e.target.value)}
                  className='min-h-32'
                />
              </div>

              <SubmitButton onClick={handleTest} loading={isLoading}>
                Test Alert
              </SubmitButton>
            </CardContent>
          </Card>

          {stories.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Summaries</CardTitle>
              </CardHeader>
              <CardContent className='grid gap-4'>
                {stories.map((story) => (
                  <div key={story.url} className='grid gap-2'>
                    <h3 className='font-semibold'>{story.title}</h3>
                    {story.keyFindings && (
                      <ul className='list-disc ml-4'>
                        {story.keyFindings.map((k) => (
                          <li key={k}>{k}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {stories.length > 0 && (
          <div className='border rounded-md overflow-auto'>
            <Alert stories={stories as unknown as Story[]} />
          </div>
        )}
      </div>
    </div>
  )
}
