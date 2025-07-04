import { getPocketBase } from '@/lib/pocketbaseClient'
import { cookies } from 'next/headers'

export interface User {
    id: string
    email: string
    name: string
    verified: boolean
    avatar?: string
    created: string
    updated: string
}

export async function getCurrentUser(): Promise<User | null> {
    try {
        const cookieStore = await cookies()
        const authCookie = cookieStore.get('pb_auth')

        if (!authCookie?.value) {
            return null
        }

        const pb = getPocketBase()
        pb.authStore.loadFromCookie(authCookie.value)

        if (!pb.authStore.isValid) {
            return null
        }

        // Try to refresh the auth to ensure it's still valid
        try {
            await pb.collection('users').authRefresh()
        } catch (error) {
            // Auth refresh failed, but don't try to delete cookie here
            // The middleware will handle cleaning up invalid cookies
            return null
        }

        const authModel = pb.authStore.model
        if (!authModel) return null

        const user: User = {
            id: authModel.id,
            email: authModel.email,
            name: authModel.name,
            verified: authModel.verified,
            avatar: authModel.avatar,
            created: authModel.created,
            updated: authModel.updated
        }

        return user
    } catch (error) {
        console.error('Error getting current user:', error)
        return null
    }
}

export async function getAuthStatus(): Promise<{ isAuthenticated: boolean; user: User | null }> {
    try {
        const cookieStore = await cookies()
        const authCookie = cookieStore.get('pb_auth')

        if (!authCookie?.value) {
            return { isAuthenticated: false, user: null }
        }

        const pb = getPocketBase()
        pb.authStore.loadFromCookie(authCookie.value)

        if (!pb.authStore.isValid) {
            return { isAuthenticated: false, user: null }
        }

        const authModel = pb.authStore.model
        if (!authModel) {
            return { isAuthenticated: false, user: null }
        }

        const user: User = {
            id: authModel.id,
            email: authModel.email,
            name: authModel.name,
            verified: authModel.verified,
            avatar: authModel.avatar,
            created: authModel.created,
            updated: authModel.updated
        }

        return { isAuthenticated: true, user }
    } catch (error) {
        console.error('Error checking auth status:', error)
        return { isAuthenticated: false, user: null }
    }
}

export async function isAuthenticated(): Promise<boolean> {
    const user = await getCurrentUser()
    return user !== null
}
