import { api } from '@everynews/app/api'
import { EditNewsForm } from '@everynews/app/news/edit/[id]/form'
import { News, newsSchema } from '@everynews/drizzle/types'
import { Suspense } from 'react'

interface EditNewsPageParams {
  params: Promise<{ id: string }>
}

export default async function EditNewsPage({ params }: EditNewsPageParams) {
  const { id } = await params
  const response = await api.news[':id'].$get({
    param: { id },
  })
  const news = await response.json()
  const newsItems: News = newsSchema.parse(news)
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EditNewsForm news={newsItems} />
    </Suspense>
  )
}
