'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitProofUrl(winnerId: string, proofUrl: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  // Update winners table where id matches and belongs to the current user
  const { error } = await supabase
    .from('winners')
    .update({ 
      proof_url: proofUrl,
      proof_status: 'pending' // Moving from 'awaiting' or 'rejected' to 'pending'
    })
    .eq('id', winnerId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Submit proof error:', error)
    return { error: 'Failed to record proof. Please try again.' }
  }

  revalidatePath('/dashboard/proofs')
  return { success: true }
}
