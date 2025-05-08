import { CreateNewsForm } from '@everynews/components/news/create-news-form'
import { PageHeader } from '@everynews/components/ui/page-header'

export default function CreateNewsPage() {
  return (
    <div className='container py-8'>
      <PageHeader
        title='Create News Item'
        description='Set up a new news source to track'
      />
      <div className='mt-8'>
        <CreateNewsForm />
      </div>
    </div>
  )
}
