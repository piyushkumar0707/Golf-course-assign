import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('charities')
    .select('*')
    .eq('id', params.id)
    .eq('is_active', true)
    .single()

  if (error) {
    return new NextResponse(error.message, { status: 404 })
  }

  return NextResponse.json(data)
}
