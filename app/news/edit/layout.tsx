import { PageHeader } from '@everynews/components/ui/page-header'

const EditNewsLayout = ({ children }: { children: React.ReactNode }) => (
  <>
    <PageHeader title='Edit News Item' />
    {children}
  </>
)

export default EditNewsLayout
