export const sendMagicLink = async (
  data: { email: string; url: string; token: string },
  request?: Request | undefined,
): Promise<void> => {
  // TODO: Implement email sending logic
  console.log(`Sending magic link to ${data.email} with URL: ${data.url}`)
}
