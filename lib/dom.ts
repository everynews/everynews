import { Defuddle } from 'defuddle/node'
import type { JSDOM } from 'jsdom'
import TurndownService from 'turndown'

export const markdownify = async (
  url: string,
  dom: JSDOM | string,
): Promise<string> =>
  await Defuddle(dom, url, {
    markdown: true,
  })
    .then((result) => result.content)
    .catch(() => {
      const turndownService = new TurndownService()
      const turndown = turndownService.turndown(
        typeof dom === 'string' ? dom : dom.window.document.body.innerHTML,
      )
      return turndown
    })
