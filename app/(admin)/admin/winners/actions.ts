'use server'

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

async function verifyAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single()
  return data?.role === 'admin' ? user : null
}

export async function approveProof(winnerId: string) {
  const admin = await verifyAdmin()
  if (!admin) return { error: 'Unauthorized' }

  const { error } = await supabaseAdmin
    .from('winners')
    .update({ proof_status: 'approved' })
    .eq('id', winnerId)

  if (error) return { error: 'Failed to approve proof.' }

  revalidatePath('/admin/winners')
  return { success: true }
}

export async function rejectProof(winnerId: string, reason: string) {
  const admin = await verifyAdmin()
  if (!admin) return { error: 'Unauthorized' }

  const { error } = await supabaseAdmin
    .from('winners')
    .update({
      proof_status: 'rejected',
      rejection_reason: reason,
    })
    .eq('id', winnerId)

  if (error) return { error: 'Failed to reject proof.' }

  revalidatePath('/admin/winners')
  return { success: true }
}

export async function markWinnerPaid(winnerId: string) {
  const admin = await verifyAdmin()
  if (!admin) return { error: 'Unauthorized' }

  const { error } = await supabaseAdmin
    .from('winners')
    .update({ payment_status: 'paid' })
    .eq('id', winnerId)

  if (error) return { error: 'Failed to mark winner as paid.' }

  revalidatePath('/admin/winners')
  return { success: true }
}
