import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const featured = searchParams.get('featured')
  const supabase = await createClient()

  let query = supabase.from('charities').select('*').eq('is_active', true)
  
  if (featured === 'true') {
     query = query.eq('is_featured', true)
  }

  const { data, error } = await query

  if (error) {
    return new NextResponse(error.message, { status: 500 })
  }

  return NextResponse.json(data)
}
