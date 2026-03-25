import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth'

export async function POST(req: Request) {
  const { role } = await getUser()
  if (role !== 'admin') return new NextResponse('Unauthorized', { status: 401 })

  const { name, description, image_urls, is_featured, events } = await req.json()
  const supabase = await createClient()

  if (is_featured) {
    await supabase.from('charities').update({ is_featured: false }).eq('is_featured', true)
  }

  const { data, error } = await supabase.from('charities').insert({
    name, description, image_urls, is_featured, events
  }).select().single()

  if (error) return new NextResponse(error.message, { status: 500 })
  return NextResponse.json(data)
}

export async function GET() {
  const { role } = await getUser()
  if (role !== 'admin') return new NextResponse('Unauthorized', { status: 401 })

  const supabase = await createClient()
  const { data, error } = await supabase.from('charities').select('*').order('created_at', { ascending: false })
  
  if (error) return new NextResponse(error.message, { status: 500 })
  return NextResponse.json(data)
}
