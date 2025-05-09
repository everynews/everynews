import { api } from '@everynews/app/api'
import { EditNewsForm } from '@everynews/app/news/edit/[id]/form'
import { News, newsReadSchema } from '@everynews/drizzle/types'
import { Suspense } from 'react'

interface EditNewsPageParams {
  params: Promise<{ id: string }>
}

/**
 * Server component for editing a news item by its ID.
 *
 * Awaits the `id` parameter, fetches the corresponding news data from the API, validates it, and renders the edit form within a suspense boundary.
 *
 * @param params - A promise resolving to an object containing the news item ID.
 * @returns A React element rendering the edit form for the specified news item.
 *
 * @throws {ZodError} If the fetched news data fails schema validation.
 */
export default async function EditNewsPage({ params }: EditNewsPageParams) {
  const { id } = await params
  const res = await api.news[':id'].$get({
    param: { id },
  })
  const { data } = await res.json()
  const newsItems: News = newsReadSchema.parse(data)
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EditNewsForm news={newsItems} />
    </Suspense>
  )
}
