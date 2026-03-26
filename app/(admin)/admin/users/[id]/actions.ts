'use server'

import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function getAdminUser() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null

  return user
}

export async function overrideSubscriptionStatus(userId: string, targetStatus: string) {
  const adminUser = await getAdminUser()
  if (!adminUser) return { error: 'Unauthorized' }

  // Get old value for audit
  const { data: oldProfile } = await supabaseAdmin.from('profiles').select('subscription_status').eq('id', userId).single()

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ subscription_status: targetStatus })
    .eq('id', userId)

  if (error) return { error: 'Failed to update user status.' }

  // Log to audit
  await supabaseAdmin.from('audit_log').insert({
    admin_id: adminUser.id,
    action: 'override_subscription',
    target_table: 'profiles',
    target_id: userId,
    old_value: { subscription_status: oldProfile?.subscription_status },
    new_value: { subscription_status: targetStatus }
  })

  revalidatePath(`/admin/users/${userId}`)
  revalidatePath('/admin/users')
  return { success: true }
}

export async function adminEditScore(scoreId: string, newScoreValue: number, userId: string) {
  const adminUser = await getAdminUser()
  if (!adminUser) return { error: 'Unauthorized' }

  if (newScoreValue < 1 || newScoreValue > 45) return { error: 'Score must be between 1 and 45.' }

  const { data: oldScore } = await supabaseAdmin.from('scores').select('score').eq('id', scoreId).single()

  const { error } = await supabaseAdmin
    .from('scores')
    .update({ score: newScoreValue })
    .eq('id', scoreId)

  if (error) return { error: 'Failed to update score.' }

  await supabaseAdmin.from('audit_log').insert({
    admin_id: adminUser.id,
    action: 'edit_score',
    target_table: 'scores',
    target_id: scoreId,
    old_value: { score: oldScore?.score },
    new_value: { score: newScoreValue }
  })

  revalidatePath(`/admin/users/${userId}`)
  return { success: true }
}

export async function adminDeleteScore(scoreId: string, userId: string) {
  const adminUser = await getAdminUser()
  if (!adminUser) return { error: 'Unauthorized' }

  const { data: oldScore } = await supabaseAdmin.from('scores').select('*').eq('id', scoreId).single()

  const { error } = await supabaseAdmin
    .from('scores')
    .delete()
    .eq('id', scoreId)

  if (error) return { error: 'Failed to delete score.' }

  await supabaseAdmin.from('audit_log').insert({
    admin_id: adminUser.id,
    action: 'delete_score',
    target_table: 'scores',
    target_id: scoreId,
    old_value: oldScore,
    new_value: null
  })

  revalidatePath(`/admin/users/${userId}`)
  return { success: true }
}
