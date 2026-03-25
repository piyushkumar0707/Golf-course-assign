import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const setProfileCookies = (profile: { role: string; subscription_status: string }, cacheTTLSeconds: number, now: number) => {
    const profileCacheKey = `profile_cache_${user!.id}`
    const profileCacheTimestampKey = `profile_cache_timestamp_${user!.id}`

    response.cookies.set(profileCacheKey, JSON.stringify(profile), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: cacheTTLSeconds,
    })
    response.cookies.set(profileCacheTimestampKey, now.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: cacheTTLSeconds,
    })
    response.cookies.set('gc_profile_data', JSON.stringify(profile), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: cacheTTLSeconds,
    })
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const isDashboardRoute = path.startsWith('/dashboard')
  const isAdminRoute = path.startsWith('/admin')

  if (!user && (isDashboardRoute || isAdminRoute)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && (isDashboardRoute || isAdminRoute)) {
    // Check for cached profile to avoid database query on every request
    const profileCacheKey = `profile_cache_${user.id}`
    const profileCacheTimestampKey = `profile_cache_timestamp_${user.id}`
    const cacheTimestamp = request.cookies.get(profileCacheTimestampKey)?.value
    const now = Date.now()
    const cacheTTL = 60 * 1000 // 60 seconds

    let profile = null

    // Try to use cached profile if available and not expired
    if (cacheTimestamp && now - parseInt(cacheTimestamp) < cacheTTL) {
      const cachedProfile = request.cookies.get(profileCacheKey)?.value
      if (cachedProfile) {
        try {
          profile = JSON.parse(cachedProfile)
        } catch (e) {
          // Invalid cache, will query database
        }
      }
    }

    // If no valid cache, query database only once per TTL
    if (!profile) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('role, subscription_status')
        .eq('id', user.id)
        .single()

      if (profileData) {
        profile = profileData
        setProfileCookies(profile, cacheTTL / 1000, now)
      }
    }

    // Use cached or freshly fetched profile for authorization checks
    if (isAdminRoute && profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    const isSettingsPage = path.startsWith('/dashboard/settings')
    if (isDashboardRoute && !isSettingsPage) {
      // Active cache can be trusted for fast path.
      if (profile?.subscription_status !== 'active') {
        // Inactive/no-cache must be verified against canonical status endpoint before gating.
        try {
          const verifyRes = await fetch(new URL('/api/user/subscription', request.url), {
            method: 'GET',
            headers: {
              cookie: request.headers.get('cookie') || '',
            },
            cache: 'no-store',
          })

          if (verifyRes.ok) {
            const payload = await verifyRes.json()
            if (payload?.subscriptionStatus === 'active') {
              profile = {
                role: profile?.role || 'subscriber',
                subscription_status: 'active',
              }
              setProfileCookies(profile, cacheTTL / 1000, now)
            } else {
              return NextResponse.redirect(new URL('/subscribe', request.url))
            }
          } else {
            return NextResponse.redirect(new URL('/subscribe', request.url))
          }
        } catch {
          return NextResponse.redirect(new URL('/subscribe', request.url))
        }
      }
    }
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
}
