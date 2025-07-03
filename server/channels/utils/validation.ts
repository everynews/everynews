import { z } from 'zod'

export const checkSignInEmailConflict = (
  config: unknown,
  userEmail: string,
  _channelType: string,
) => {
  const parsedConfig = z.object({ destination: z.string() }).safeParse(config)

  if (parsedConfig.success && parsedConfig.data.destination === userEmail) {
    return {
      error:
        'Cannot use your sign-in email as a channel. Your sign-in email is already your default channel.',
    }
  }

  return null
}
