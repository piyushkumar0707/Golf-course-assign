import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth'

export async function GET() {
  const { role } = await getUser()
  if (role !== 'admin') return new NextResponse('Unauthorized', { status: 401 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('draws')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return new NextResponse(error.message, { status: 500 })
  return NextResponse.json(data || [])
}

export async function POST(req: Request) {
  const { role } = await getUser()
  if (role !== 'admin') return new NextResponse('Unauthorized', { status: 401 })

  const { month, year, draw_type } = await req.json()
  if (!month || !year || !['random', 'weighted'].includes(draw_type)) {
    return new NextResponse('Invalid payload', { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('draws')
    .insert({
      month,
      year,
      draw_type,
      status: 'pending',
    })
    .select()
    .single()

  if (error) return new NextResponse(error.message, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
