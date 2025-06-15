'use client'

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
import type { LanguageCode } from '@everynews/schema/language'
import { LANGUAGE_CODES, LANGUAGE_LABELS } from '@everynews/schema/language'

interface PromptDetailsCardProps {
  name: string
  language: LanguageCode
  content: string
  onNameChange: (value: string) => void
  onLanguageChange: (value: LanguageCode) => void
  onContentChange: (value: string) => void
  nameId: string
  languageId: string
  contentId: string
  contentPlaceholder?: string
}

export const PromptDetailsCard = ({
  name,
  language,
  content,
  onNameChange,
  onLanguageChange,
  onContentChange,
  nameId,
  languageId,
  contentId,
  contentPlaceholder,
}: PromptDetailsCardProps) => (
  <Card>
    <CardHeader>
      <CardTitle>Prompt Details</CardTitle>
    </CardHeader>
    <CardContent className='grid gap-6'>
      <div className='grid gap-2'>
        <Label htmlFor={nameId}>Prompt Name</Label>
        <Input
          id={nameId}
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder='My Custom Prompt'
        />
      </div>

      <div className='grid gap-2'>
        <Label htmlFor={languageId}>Language</Label>
        <Select
          value={language}
          onValueChange={(value) => onLanguageChange(value as LanguageCode)}
        >
          <SelectTrigger id={languageId}>
            <SelectValue placeholder='Select language' />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGE_CODES.map((lang: LanguageCode) => (
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
          onChange={(e) => onContentChange(e.target.value)}
          placeholder={contentPlaceholder}
          className='min-h-[12rem]'
        />
      </div>
    </CardContent>
  </Card>
)
