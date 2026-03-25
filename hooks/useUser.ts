'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/browser'
import { User } from '@supabase/supabase-js'

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        setRole(data?.role || 'subscriber')
      }
      setLoading(false)
    }

    fetchUser()

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user || null
        setUser(currentUser)
        if (currentUser) {
          const { data } = await supabase.from('profiles').select('role').eq('id', currentUser.id).single()
          setRole(data?.role || 'subscriber')
        } else {
          setRole(null)
        }
        setLoading(false)
      }
    )

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, []) // Remove supabase from dependency array since createClient returns a singleton. Wait, no it doesn't return a singleton necessarily but it's fine if we omit or memoize it. Actually just taking it out is fine.

  return { user, role, loading }
}
