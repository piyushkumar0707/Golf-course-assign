'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addScore(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const scoreRaw = formData.get('score')
  const dateRaw = formData.get('played_on')

  if (!scoreRaw || !dateRaw) return { error: 'Missing fields' }

  const score = parseInt(scoreRaw as string, 10)
  const playedOn = new Date(dateRaw as string)

  // Validate Score
  if (isNaN(score) || score < 1 || score > 45) {
    return { error: 'Score must be between 1 and 45' }
  }

  // Validate Date
  const now = new Date()
  if (playedOn > now) {
    return { error: 'Date cannot be in the future' }
  }

  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(now.getFullYear() - 1)
  if (playedOn < oneYearAgo) {
    return { error: 'Score must have been played within the last 12 months' }
  }

  // Insert score
  const { error } = await supabase.from('scores').insert({
    user_id: user.id,
    score,
    played_on: playedOn.toISOString().split('T')[0], // YYYY-MM-DD
  })

  if (error) {
    console.error(error)
    return { error: 'Failed to save score. Please try again.' }
  }

  revalidatePath('/dashboard/scores')
  revalidatePath('/dashboard')
  
  return { success: true }
}

export async function deleteScore(scoreId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('scores')
    .delete()
    .eq('id', scoreId)
    .eq('user_id', user.id)

  if (error) {
    return { error: 'Failed to delete score' }
  }

  revalidatePath('/dashboard/scores')
  revalidatePath('/dashboard')
  return { success: true }
}
