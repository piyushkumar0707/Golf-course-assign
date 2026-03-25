'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/browser'
import { User } from '@supabase/supabase-js'

const PROFILE_CACHE_TTL_MS = 60_000 // Match middleware cache TTL

type CachedProfile = {
  userId: string
  role: string | null
  subscriptionStatus: string | null
  cachedAt: number
}

function readCachedProfile(userId: string): CachedProfile | null {
  if (typeof window === 'undefined') return null

  try {
    // Try both sessionStorage and localStorage for maximum cache hit rate
    let raw = window.sessionStorage.getItem('gc_profile_cache')
    if (!raw) {
      raw = window.localStorage.getItem('gc_profile_cache')
    }
    if (!raw) return null

    const parsed = JSON.parse(raw) as CachedProfile
    const isFresh = Date.now() - parsed.cachedAt < PROFILE_CACHE_TTL_MS

    if (parsed.userId === userId && isFresh) return parsed
    return null
  } catch {
    return null
  }
}

function writeCachedProfile(userId: string, role: string | null, subscriptionStatus: string | null) {
  if (typeof window === 'undefined') return

  const payload: CachedProfile = {
    userId,
    role,
    subscriptionStatus,
    cachedAt: Date.now(),
  }

  // Write to both sessionStorage and localStorage for redundancy
  window.sessionStorage.setItem('gc_profile_cache', JSON.stringify(payload))
  window.localStorage.setItem('gc_profile_cache', JSON.stringify(payload))
}

function clearCachedProfile() {
  if (typeof window === 'undefined') return
  window.sessionStorage.removeItem('gc_profile_cache')
  window.localStorage.removeItem('gc_profile_cache')
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    let isMounted = true

    const applyProfile = async (currentUser: User) => {
      const cached = readCachedProfile(currentUser.id)
      if (cached) {
        if (!isMounted) return
        setRole(cached.role || 'subscriber')
        setSubscriptionStatus(cached.subscriptionStatus || 'inactive')
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('role, subscription_status')
        .eq('id', currentUser.id)
        .single()

      if (!isMounted) return

      const nextRole = data?.role || 'subscriber'
      const nextStatus = data?.subscription_status || 'inactive'
      setRole(nextRole)
      setSubscriptionStatus(nextStatus)
      writeCachedProfile(currentUser.id, nextRole, nextStatus)
    }

    const bootstrap = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const currentUser = session?.user || null

      if (!isMounted) return

      setUser(currentUser)
      setLoading(false)

      if (currentUser) {
        // Try to read profile from middleware cookie first
        const profileCookie = document.cookie
          .split('; ')
          .find(row => row.startsWith('gc_profile_data='))
          ?.split('=')[1]
        
        if (profileCookie) {
          try {
            const cachedProfile = JSON.parse(decodeURIComponent(profileCookie))
            if (!isMounted) return
            setRole(cachedProfile.role || 'subscriber')
            setSubscriptionStatus(cachedProfile.subscription_status || 'inactive')
            writeCachedProfile(currentUser.id, cachedProfile.role, cachedProfile.subscription_status)
            return // Profile loaded from cookie, skip database query
          } catch (e) {
            // Cookie parse failed, will fall through to database query
          }
        }
        
        // Fallback: load from cache or database
        await applyProfile(currentUser)
      } else {
        setRole(null)
        setSubscriptionStatus(null)
        clearCachedProfile()
      }
    }

    bootstrap()

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event: string, session: any) => {
        if (!isMounted) return
        if (event === 'INITIAL_SESSION') return

        const currentUser = session?.user || null
        setUser(currentUser)
        setLoading(false)

        if (currentUser) {
          await applyProfile(currentUser)
        } else {
          setRole(null)
          setSubscriptionStatus(null)
          clearCachedProfile()
        }
      }
    )

    return () => {
      isMounted = false
      authListener.subscription.unsubscribe()
    }
  }, [])

  return { user, role, subscriptionStatus, loading }
}
