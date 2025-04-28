'use client'

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@everynews/components/ui/toast'
import { useToast } from '@everynews/hooks/use-toast'

export const Toaster = () => {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, ...props }) => (
        <Toast key={id} {...props}>
          <div className="flex w-full justify-between gap-2">
            <div className="flex flex-col gap-3">
              <div className="space-y-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
              <div>{action}</div>
            </div>
            <div>
              <ToastClose />
            </div>
          </div>
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}
