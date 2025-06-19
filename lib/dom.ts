import { Defuddle } from 'defuddle/node'
import TurndownService from 'turndown'

export const markdownify = async (url: string, html: string): Promise<string> =>
  await Defuddle(html, url, {
    markdown: true,
  })
    .then((result) => result.content)
    .catch(() => {
      const turndownService = new TurndownService()
      const turndown = turndownService.turndown(html)
      return turndown
    })
