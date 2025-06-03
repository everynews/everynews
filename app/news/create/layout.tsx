import { PageHeader } from '@everynews/components/ui/page-header'

const CreateNewsLayout = ({ children }: { children: React.ReactNode }) => (
  <>
    <PageHeader title='Create' />
    <main className='p-4'>{children}</main>
  </>
)

export default CreateNewsLayout
