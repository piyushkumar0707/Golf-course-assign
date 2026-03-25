import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth'

export async function GET() {
  const user = await getAuthenticatedUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('user_charity')
    .select('*, charities(*)')
    .eq('user_id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') { // not found error is OK
    return new NextResponse(error.message, { status: 500 })
  }

  return NextResponse.json(data || null)
}

export async function POST(req: Request) {
  const user = await getAuthenticatedUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { charity_id, contribution_pct } = await req.json()
  
  const pct = parseInt(contribution_pct)
  if (isNaN(pct) || pct < 10 || pct > 100) {
    return new NextResponse('Contribution must be between 10 and 100', { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase.from('user_charity').upsert({
    user_id: user.id,
    charity_id,
    contribution_pct: pct,
    updated_at: new Date().toISOString()
  }).select().single()
  
  if (error) return new NextResponse(error.message, { status: 500 })

  return NextResponse.json(data)
}

export async function PATCH(req: Request) {
  return POST(req)
}
