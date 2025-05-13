import { api } from '@everynews/app/api'
import { EditNewsForm } from '@everynews/app/news/edit/[id]/form'
import { toastNetworkError } from '@everynews/lib/error'
import { type News, NewsSchema } from '@everynews/schema/news'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'

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
    const newsItems = await res.json()
    if (!newsItems) {
      notFound()
    }
    const news: News = NewsSchema.parse(newsItems)
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <EditNewsForm news={news} />
      </Suspense>
    )
  } catch (e) {
    toastNetworkError(e as Error)
  }
}
