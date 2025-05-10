import { api } from '@everynews/app/api'
import { EditNewsForm } from '@everynews/app/news/edit/[id]/form'
import { News, newsReadSchema } from '@everynews/drizzle/types'
import { Suspense } from 'react'
import { notFound } from 'next/navigation'

export default async function EditNewsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  try {
    const res = await api.news[':id'].$get({
      param: { id },
    })
    if (!res.ok) {
      if (res.status === 404) {
        notFound()
      }
      throw new Error(`Failed to fetch news: ${res.statusText}`)
    }
    const { data } = await res.json()
    if (!data) {
      notFound()
    }
    const newsItems: News = newsReadSchema.parse(data)
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <EditNewsForm news={newsItems} />
      </Suspense>
    )
  } catch (error) {
    console.error('Error fetching news item:', error)
    throw error
  }
}
