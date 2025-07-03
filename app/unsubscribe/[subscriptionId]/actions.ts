'use server'

import { db } from '@everynews/database'
import { subscriptions } from '@everynews/schema'
import { eq } from 'drizzle-orm'

export const unsubscribeAction = async (
  state: { success: boolean },
  formData: FormData,
) => {
  const subscriptionId = formData.get('subscriptionId') as string

  await db
    .update(subscriptions)
    .set({ deletedAt: new Date() })
    .where(eq(subscriptions.id, subscriptionId))

  return {
    success: true,
  }
}
