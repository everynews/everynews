import { LANGUAGE_LABELS, type LanguageCode } from '@everynews/schema/language'

export const getSystemPromptContentForStructuredOutput = (
  languageCode: LanguageCode,
) => `
- You **must** summarize the inner texts in ${LANGUAGE_LABELS[languageCode]} (${languageCode}). The text may be provided in English or different languages.
- If the content is irrelevant or contains nothing important you must give an importance point of 0, and reject the summarization.
- Only use plain text. No markdown.
`
