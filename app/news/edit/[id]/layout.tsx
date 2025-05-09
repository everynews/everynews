import { PageHeader } from '@everynews/components/ui/page-header'

const EditNewsLayout = ({ children }: { children: React.ReactNode }) => (
  <>
    <PageHeader title='Edit News Item' />
    <main className='p-4'>{children}</main>
  </>
)

export default EditNewsLayout
