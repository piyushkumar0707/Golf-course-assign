'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateCharityPreferences(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  const charityId = formData.get('charity_id') as string
  const percentRaw = formData.get('charity_percent')

  if (!charityId || !percentRaw) {
    return { error: 'Please select a charity and percentage.' }
  }

  const charityPercent = parseInt(percentRaw as string, 10)

  if (isNaN(charityPercent) || charityPercent < 10 || charityPercent > 100) {
    return { error: 'Contribution must be between 10% and 100%.' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      charity_id: charityId,
      charity_percent: charityPercent
    })
    .eq('id', user.id)

  if (error) {
    console.error(error)
    return { error: 'Failed to update preferences.' }
  }

  revalidatePath('/dashboard/charity')
  revalidatePath('/dashboard')
  
  return { success: true }
}
