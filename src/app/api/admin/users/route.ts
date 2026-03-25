import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function GET(req: Request) {
  const { role } = await getUser()
  if (role !== 'admin') return new NextResponse('Unauthorized', { status: 401 })

  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = 25
  const offset = (page - 1) * limit

  const supabase = await createClient()
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let dbQuery = supabase
    .from('profiles')
    .select('id, full_name, role, subscription_status, created_at', { count: 'exact' })
  
  if (query) {
    dbQuery = dbQuery.ilike('full_name', `%${query}%`)
  }

  const { data, error } = await dbQuery
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false })

  if (error) return new NextResponse(error.message, { status: 500 })

  const enriched = await Promise.all(
    (data || []).map(async (profile) => {
      const { data: authData } = await admin.auth.admin.getUserById(profile.id)
      return {
        ...profile,
        email: authData.user?.email || null,
      }
    })
  )

  const result = query
    ? enriched.filter(
        (u) =>
          (u.full_name || '').toLowerCase().includes(query.toLowerCase()) ||
          (u.email || '').toLowerCase().includes(query.toLowerCase())
      )
    : enriched

  return NextResponse.json(result)
}
