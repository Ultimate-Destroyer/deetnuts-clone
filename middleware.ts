import { type NextRequest, NextResponse } from 'next/server'
import { getPocketBase } from '@/lib/pocketbaseClient'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Add pathname to headers for layout access
  response.headers.set('x-pathname', request.nextUrl.pathname)

  // Check for authentication cookie
  const authCookie = request.cookies.get('pb_auth')

  if (authCookie?.value) {
    try {
      const pb = getPocketBase()
      pb.authStore.loadFromCookie(authCookie.value)

      // Try to refresh the auth token
      if (pb.authStore.isValid) {
        try {
          await pb.collection('users').authRefresh()
          // Update the cookie with the refreshed auth
          const newCookie = pb.authStore.exportToCookie({
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
          })
          response.cookies.set('pb_auth', newCookie, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7 // 1 week
          })
        } catch (error) {
          // Auth refresh failed, clear the cookie
          response.cookies.delete('pb_auth')
        }
      } else {
        // Auth is invalid, clear the cookie
        response.cookies.delete('pb_auth')
      }
    } catch (error) {
      // Error loading auth, clear the cookie
      response.cookies.delete('pb_auth')
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}