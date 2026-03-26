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

export async function createCharity(formData: FormData) {
  const admin = await verifyAdmin()
  if (!admin) return { error: 'Unauthorized' }

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const isFeatured = formData.get('is_featured') === 'on'

  if (!name) return { error: 'Name is required' }

  // If setting as featured, first unset the existing featured charity
  if (isFeatured) {
    await supabaseAdmin.from('charities').update({ is_featured: false }).eq('is_featured', true)
  }

  const { error } = await supabaseAdmin.from('charities').insert({
    name,
    description,
    is_featured: isFeatured,
    is_active: true,
  })

  if (error) return { error: 'Failed to create charity.' }

  revalidatePath('/admin/charities')
  revalidatePath('/(public)/charities')
  return { success: true }
}

export async function updateCharity(id: string, formData: FormData) {
  const admin = await verifyAdmin()
  if (!admin) return { error: 'Unauthorized' }

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const isFeatured = formData.get('is_featured') === 'on'

  if (!name) return { error: 'Name is required' }

  if (isFeatured) {
    await supabaseAdmin.from('charities').update({ is_featured: false }).eq('is_featured', true).neq('id', id)
  }

  const { error } = await supabaseAdmin
    .from('charities')
    .update({ name, description, is_featured: isFeatured })
    .eq('id', id)

  if (error) return { error: 'Failed to update charity.' }

  revalidatePath('/admin/charities')
  return { success: true }
}

export async function toggleCharityActive(id: string, currentState: boolean) {
  const admin = await verifyAdmin()
  if (!admin) return { error: 'Unauthorized' }

  const { error } = await supabaseAdmin
    .from('charities')
    .update({ is_active: !currentState })
    .eq('id', id)

  if (error) return { error: 'Failed to toggle charity status.' }

  revalidatePath('/admin/charities')
  return { success: true }
}
