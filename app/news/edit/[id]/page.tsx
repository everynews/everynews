import { api } from '@everynews/app/api'
import { EditNewsForm } from '@everynews/components/news/edit-news-form'
import { PageHeader } from '@everynews/components/ui/page-header'
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
  const data = await response.json()
  const newsItems: News = newsSchema.parse(data)
  return (
    <div className='container py-8'>
      <PageHeader
        title='Edit News Item'
        description='Update your news source configuration'
      />
      <Suspense fallback={<div>Loading...</div>}>
        <EditNewsForm news={newsItems} />
      </Suspense>
    </div>
  )
}
