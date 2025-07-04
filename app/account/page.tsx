import AccountForm from './account-form'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function Account({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const user = await getCurrentUser()
  const params = await searchParams

  if (!user) {
    redirect('/login')
  }

  return <AccountForm user={user} message={params?.message} />
}