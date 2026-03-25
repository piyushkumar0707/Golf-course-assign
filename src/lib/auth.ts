import { createClient } from './supabase/server'
import { User } from '@supabase/supabase-js'

export async function getUser(): Promise<{ user: User | null; role: string | null; subscriptionStatus: string | null }> {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return { user: null, role: null, subscriptionStatus: null }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, subscription_status')
      .eq('id', user.id)
      .single()

    return { 
      user, 
      role: profile?.role || 'subscriber',
      subscriptionStatus: profile?.subscription_status || 'inactive'
    }
  } catch (error) {
    return { user: null, role: null, subscriptionStatus: null }
  }
}
