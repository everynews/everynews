import { toast } from 'sonner'

export const redactError = ({ error, safeAlternateString }: { error: Error; safeAlternateString: string }) => {
  return process.env.NODE_ENV === 'production' ? new Error(safeAlternateString) : error
}

export const toastNetworkError = (error: Error) => {
  toast.error(redactError({ error, safeAlternateString: 'Network Error' }).message)
}
