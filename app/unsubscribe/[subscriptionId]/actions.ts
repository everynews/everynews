'use server'

import { db } from '@everynews/database'
import { subscriptions } from '@everynews/schema'
import { eq } from 'drizzle-orm'

export const unsubscribeAction = async (
  state: { success: boolean; loading: boolean },
  formData: FormData,
) => {
  state.loading = true
  await db
    .update(subscriptions)
    .set({ deletedAt: new Date() })
    .where(eq(subscriptions.id, formData.get('subscriptionId') as string))
  state.loading = false
  return {
    loading: false,
    success: true,
  }
}
