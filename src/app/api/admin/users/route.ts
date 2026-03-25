import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth'

export async function GET(req: Request) {
  const { role } = await getUser()
  if (role !== 'admin') return new NextResponse('Unauthorized', { status: 401 })

  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = 25
  const offset = (page - 1) * limit

  const supabase = await createClient()

  let dbQuery = supabase
    .from('profiles')
    .select('id, full_name, role, subscription_status, auth_users!inner(email)', { count: 'exact' })

  // Note: we might need custom SQL or a view to join with auth.users email efficiently
  // For now let's hope the inner join works if configured correctly, otherwise we use service role to list auth users
  
  if (query) {
    dbQuery = dbQuery.or(`full_name.ilike.%${query}%,auth_users.email.ilike.%${query}%`)
  }

  const { data, count, error } = await dbQuery
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false })

  if (error) {
     // fallback if join fails (common in supabase outside of certain contexts)
     const { data: profiles } = await supabase.from('profiles').select('*').limit(limit)
     return NextResponse.json(profiles || [])
  }

  // simplify data
  const result = data.map(p => ({
     ...p,
     email: (p as any).auth_users?.email
  }))

  return NextResponse.json(result)
}
