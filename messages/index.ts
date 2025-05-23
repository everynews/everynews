export const sendMagicLink = async (
  data: { email: string; url: string; token: string },
  request?: Request | undefined,
): Promise<void> => {
  console.log(`Request: ${request}`)
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`Sending magic link to ${data.email} with URL: ${data.url}`)
    }, 1000)
    resolve()
  })
}
