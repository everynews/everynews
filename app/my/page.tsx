import { redirect } from 'next/navigation'

export const metadata = {
  description: 'User dashboard redirect',
  title: 'My Account',
}

export default function MyPage() {
  redirect('/my/alerts')
}
