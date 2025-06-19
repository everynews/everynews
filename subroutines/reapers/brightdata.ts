export const brightdata = async (url: string): Promise<string> => {
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
