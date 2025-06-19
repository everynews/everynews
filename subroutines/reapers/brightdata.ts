import { chromium } from 'playwright'

export const brightdataWss = async (
  url: string,
): Promise<{
  html: string
  title: string
}> => {
  if (!process.env.BRIGHTDATA_PLAYWRIGHT_WSS) {
    throw new Error('BRIGHTDATA_PLAYWRIGHT_WSS is not set')
  }

  const browser = await chromium.connectOverCDP(
    process.env.BRIGHTDATA_PLAYWRIGHT_WSS,
  )
  const page = await browser.newPage()
  await page.goto(url)
  const html = await page.content()
  const title = await page.title()
  await browser.close()

  return { html, title }
}

export const brightdataHosted = async (url: string): Promise<string> => {
  if (!process.env.BRIGHTDATA_API_KEY) {
    throw new Error('BRIGHTDATA_API_KEY is not set')
  }

  const response = await fetch('https://api.brightdata.com/request', {
    body: JSON.stringify({
      format: 'raw',
      url,
      zone: 'everynews',
    }),
    headers: {
      Authorization: `Bearer ${process.env.BRIGHTDATA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })

  if (!response.ok) {
    throw new Error(
      `BrightData API error: ${response.status} ${response.statusText} ${await response.text()}`,
    )
  }

  return await response.text()
}
