import { api } from '@everynews/app/api'
import { EditNewsForm } from '@everynews/app/news/edit/[id]/form'
import { News, newsReadSchema } from '@everynews/drizzle/types'
import { Suspense } from 'react'

interface EditNewsPageParams {
  params: Promise<{ id: string }>
}

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
