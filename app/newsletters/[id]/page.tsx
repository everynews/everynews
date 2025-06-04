import { whoami } from '@everynews/auth/session'
import { NewsForm } from '@everynews/components/newsletter-detail'
import { db } from '@everynews/drizzle'
import { NewsletterSchema, newsletter } from '@everynews/schema/newsletter'
import { eq } from 'drizzle-orm'
import { notFound, unauthorized } from 'next/navigation'
import { Suspense } from 'react'

export default async function EditNewsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await whoami()

  const item = NewsletterSchema.parse(
    await db.query.newsletter.findFirst({
      where: eq(newsletter.id, id),
    }),
  )

  if (!item) notFound()
  if (!item.isPublic && item.userId !== user?.id) unauthorized()

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewsForm mode='edit' original={item} />
    </Suspense>
  )
}
