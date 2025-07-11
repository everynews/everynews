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

  let browser = null
  try {
    browser = await chromium.connectOverCDP(
      process.env.BRIGHTDATA_PLAYWRIGHT_WSS,
      {
        timeout: 10000, // 10 second connection timeout
      },
    )
    const page = await browser.newPage()
    await page.goto(url, {
      timeout: 30000, // 30 second navigation timeout
      waitUntil: 'domcontentloaded',
    })
    const html = await page.content()
    const title = await page.title()
    return { html, title }
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

export const brightdataHosted = async (url: string): Promise<string> => {
  if (!process.env.BRIGHTDATA_API_KEY) {
    throw new Error('BRIGHTDATA_API_KEY is not set')
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 60000) // 60 second timeout

  try {
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
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(
        `BrightData API error: ${response.status} ${response.statusText} ${await response.text()}`,
      )
    }

    return await response.text()
  } finally {
    clearTimeout(timeout)
  }
}
