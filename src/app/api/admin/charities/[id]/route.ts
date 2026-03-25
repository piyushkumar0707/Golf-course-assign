import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { role } = await getUser()
  if (role !== 'admin') return new NextResponse('Unauthorized', { status: 401 })

  const updates = await req.json()
  const supabase = await createClient()

  if (updates.is_featured) {
    await supabase.from('charities').update({ is_featured: false }).eq('is_featured', true)
  }

  const { data, error } = await supabase.from('charities').update({
    name: updates.name,
    description: updates.description,
    image_urls: updates.image_urls,
    is_featured: updates.is_featured,
    events: updates.events,
    is_active: updates.is_active
  }).eq('id', id).select().single()

  if (error) return new NextResponse(error.message, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { role } = await getUser()
  if (role !== 'admin') return new NextResponse('Unauthorized', { status: 401 })

  const supabase = await createClient()
  // soft delete
  const { error } = await supabase.from('charities').update({ is_active: false }).eq('id', id)
  
  if (error) return new NextResponse(error.message, { status: 500 })
  return new NextResponse('OK', { status: 200 })
}
