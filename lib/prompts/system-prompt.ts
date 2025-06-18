import { LANGUAGE_LABELS, type LanguageCode } from '@everynews/schema/language'
import { LANGUAGE_KEYFINDING, LANGUAGE_TITLE } from '../language-defaults'

export const getSystemPromptContent = (languageCode: LanguageCode) => `
- Do not simply introduce the article; research why this is interesting.
- Within Title or Key Findings, write plain text only; no markdowns.
- Within Importance, give an integer number of 0 to 100.
- Use simple language, as if you're talking to a friend.
- Be honest, and don't force friendliness.
- Avoid unnecessary adjectives and adverbs.
- Original title may include why it was impactful or interesting.
- If the content is irrelevant or contains nothing important you must give an importance point of 0.
  - This may include texts such as 404 Not Found, 403 Forbidden, Access Denied, or similar error messages),
- You must summarize the inner texts in ${LANGUAGE_LABELS[languageCode]} (${languageCode}).

FORMAT:

"""
<LANGUAGECODE>
${languageCode}
</LANGUAGECODE>

<TITLE>
${LANGUAGE_TITLE[languageCode]}
</TITLE>

<IMPORTANCE>
70
</IMPORTANCE>

<KEYFINDING>
${LANGUAGE_KEYFINDING[languageCode]} (1)
</KEYFINDING>

<KEYFINDING>
${LANGUAGE_KEYFINDING[languageCode]} (2)
</KEYFINDING>

<KEYFINDING>
${LANGUAGE_KEYFINDING[languageCode]} (3)
</KEYFINDING>
"""`

export const getSystemPromptContentForStructuredOutput = (
  languageCode: LanguageCode,
) => `
- Do not simply introduce the article; research why this is interesting.
- Within Title or Key Findings, write plain text only; no markdowns.
- Within Importance, give an integer number of 0 to 100.
- Use simple language, as if you're talking to a friend.
- Be honest, and don't force friendliness.
- Avoid unnecessary adjectives and adverbs.
- Original title may include why it was impactful or interesting.
- If the content is irrelevant or contains nothing important you must give an importance point of 0.
  - This may include texts such as 404 Not Found, 403 Forbidden, Access Denied, or similar error messages),
- You must summarize the inner texts in ${LANGUAGE_LABELS[languageCode]} (${languageCode}).
- Always set the languageCode field to '${languageCode}' in your response.
- Provide 3 key findings as separate items in the keyFindings array.`
