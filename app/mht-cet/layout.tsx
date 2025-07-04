import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function MHTCETLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const user = await getCurrentUser()

    if (!user) {
        redirect('/mht-cet-login-required')
    }

    return <>{children}</>
}
