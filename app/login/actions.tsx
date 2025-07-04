'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getPocketBase } from '@/lib/pocketbaseClient'
import { cookies } from 'next/headers'
import { ClientResponseError } from 'pocketbase'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const redirectTo = formData.get('redirect') as string || '/account'

  // Validate input
  if (!email || !password) {
    const params = new URLSearchParams({ message: 'Please fill in all fields' })
    if (redirectTo && redirectTo !== '/account') params.set('redirect', redirectTo)
    return redirect(`/login?${params.toString()}`)
  }

  if (!email.includes('@')) {
    const params = new URLSearchParams({ message: 'Please enter a valid email address' })
    if (redirectTo && redirectTo !== '/account') params.set('redirect', redirectTo)
    return redirect(`/login?${params.toString()}`)
  }

  if (password.length < 8) {
    const params = new URLSearchParams({ message: 'Password must be at least 8 characters long' })
    if (redirectTo && redirectTo !== '/account') params.set('redirect', redirectTo)
    return redirect(`/login?${params.toString()}`)
  }

  const pb = getPocketBase()

  try {
    const authData = await pb.collection('users').authWithPassword(email, password)

    // Remove verification check - allow unverified users to login
    // if (!authData.record.verified) {
    //   return redirect('/login?message=Please verify your email before logging in')
    // }

    const cookieStore = await cookies()
    const cookie = pb.authStore.exportToCookie({
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    })

    cookieStore.set({
      name: 'pb_auth',
      value: cookie,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    })

  } catch (error) {
    console.error('Login error:', error)
    const params = new URLSearchParams()
    if (redirectTo && redirectTo !== '/account') params.set('redirect', redirectTo)

    if (error instanceof ClientResponseError) {
      if (error.status === 400) {
        params.set('message', 'Invalid email or password')
        return redirect(`/login?${params.toString()}`)
      }
    }
    params.set('message', 'Login failed. Please try again.')
    return redirect(`/login?${params.toString()}`)
  }

  revalidatePath('/', 'layout')
  redirect(redirectTo)
}

export async function signup(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const passwordConfirm = formData.get('passwordConfirm') as string
  const name = formData.get('name') as string
  const redirectTo = formData.get('redirect') as string || '/account'

  // Validate input
  if (!email || !password || !passwordConfirm || !name) {
    const params = new URLSearchParams({ message: 'Please fill in all fields' })
    if (redirectTo && redirectTo !== '/account') params.set('redirect', redirectTo)
    return redirect(`/signup?${params.toString()}`)
  }

  if (!email.includes('@')) {
    const params = new URLSearchParams({ message: 'Please enter a valid email address' })
    if (redirectTo && redirectTo !== '/account') params.set('redirect', redirectTo)
    return redirect(`/signup?${params.toString()}`)
  }

  if (password.length < 8) {
    const params = new URLSearchParams({ message: 'Password must be at least 8 characters long' })
    if (redirectTo && redirectTo !== '/account') params.set('redirect', redirectTo)
    return redirect(`/signup?${params.toString()}`)
  }

  if (password !== passwordConfirm) {
    const params = new URLSearchParams({ message: 'Passwords do not match' })
    if (redirectTo && redirectTo !== '/account') params.set('redirect', redirectTo)
    return redirect(`/signup?${params.toString()}`)
  }

  if (name.trim().length < 2) {
    const params = new URLSearchParams({ message: 'Name must be at least 2 characters long' })
    if (redirectTo && redirectTo !== '/account') params.set('redirect', redirectTo)
    return redirect(`/signup?${params.toString()}`)
  }

  const pb = getPocketBase()

  const data = {
    email: email.trim().toLowerCase(),
    emailVisibility: true,
    password: password,
    passwordConfirm: passwordConfirm,
    name: name.trim(),
  }
  try {
    const record = await pb.collection('users').create(data)
    await pb.collection('users').requestVerification(email)
  } catch (error) {
    console.error('Signup error:', error)
    const params = new URLSearchParams()
    if (redirectTo && redirectTo !== '/account') params.set('redirect', redirectTo)

    if (error instanceof ClientResponseError) {
      const errorData = error.response?.data
      if (errorData?.email?.message?.includes('unique')) {
        params.set('message', 'An account with this email already exists. Please log in instead.')
        return redirect(`/signup?${params.toString()}`)
      }
      if (errorData?.password?.message) {
        params.set('message', 'Password must be at least 8 characters long')
        return redirect(`/signup?${params.toString()}`)
      }
      if (errorData?.name?.message) {
        params.set('message', 'Please enter a valid name')
        return redirect(`/signup?${params.toString()}`)
      }
    }
    params.set('message', 'Failed to create account. Please try again.')
    return redirect(`/signup?${params.toString()}`)
  }
  // Automatically log the user in after successful signup
  try {
    // Small delay to ensure user record is fully created
    await new Promise(resolve => setTimeout(resolve, 100))

    const authData = await pb.collection('users').authWithPassword(email, password)

    const cookieStore = await cookies()
    const cookie = pb.authStore.exportToCookie({
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    })

    cookieStore.set({
      name: 'pb_auth',
      value: cookie,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    })

    revalidatePath('/', 'layout')

    // Try to add success message to destination URL if possible
    try {
      const url = new URL(redirectTo, 'https://example.com') // Use dummy base for relative URLs
      url.searchParams.set('message', 'Account created successfully! Welcome to the platform.')
      redirect(url.pathname + url.search)
    } catch {
      // If URL manipulation fails, just redirect to the destination
      redirect(redirectTo)
    }
  } catch (error) {
    // If auto-login fails, still redirect to original destination but with a success message
    revalidatePath('/', 'layout')
    // Try to add success message to destination URL if possible
    try {
      const url = new URL(redirectTo, 'https://example.com') // Use dummy base for relative URLs
      url.searchParams.set('message', 'Account created successfully! You have been logged in.')
      redirect(url.pathname + url.search)
    } catch {
      // If URL manipulation fails, just redirect to the destination
      redirect(redirectTo)
    }
  }
}

export async function updateProfile(formData: FormData) {
  const name = formData.get('name') as string

  if (!name || name.trim().length < 2) {
    redirect('/account?message=Name must be at least 2 characters long')
  }

  const cookieStore = await cookies()
  const authCookie = cookieStore.get('pb_auth')

  if (!authCookie?.value) {
    redirect('/login')
  }

  const pb = getPocketBase()
  pb.authStore.loadFromCookie(authCookie.value)

  if (!pb.authStore.isValid || !pb.authStore.model) {
    redirect('/login')
  }

  try {
    const data = {
      name: name.trim(),
      emailVisibility: true,
    }

    await pb.collection('users').update(pb.authStore.model.id, data)

    revalidatePath('/account')
    // Don't use redirect inside try-catch
  } catch (error) {
    console.error('Error updating profile:', error)
    redirect('/account?message=Failed to update profile. Please try again.')
  }

  // Success case - redirect outside try-catch
  redirect('/account?message=Profile updated successfully!')
}

export async function clearAuthCookie() {
  const cookieStore = await cookies()
  cookieStore.set({
    name: 'pb_auth',
    value: '',
    maxAge: 0
  })
}

export async function signOut() {
  const cookieStore = await cookies()
  cookieStore.set({
    name: 'pb_auth',
    value: '',
    maxAge: 0
  })

  revalidatePath('/', 'layout')
  redirect('/')
}