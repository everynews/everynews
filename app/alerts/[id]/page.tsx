import { db } from '@everynews/database'
import { alert } from '@everynews/schema/alert'
import { isNull } from 'drizzle-orm'
import { redirect } from 'next/navigation'

export const metadata = {
  description: 'Recent stories from this alert.',
  title: 'Alert Stories',
}

export default async function AlertStoriesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const { id } = await params
  const { page = '1' } = await searchParams

  // Redirect to the new route structure
  redirect(`/alerts/${id}/page/${page}`)
}

export const generateStaticParams = async () => {
  const rows = await db
    .select({ id: alert.id })
    .from(alert)
    .where(isNull(alert.deletedAt))

  return rows.map(({ id }) => ({ id }))
}
