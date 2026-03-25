import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function GET() {
  const { role } = await getUser()
  if (role !== 'admin') return new NextResponse('Unauthorized', { status: 401 })

  const supabase = await createClient()
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data, error } = await supabase
    .from('winners')
    .select('*, profiles(id, full_name), draws(*)')
    .order('created_at', { ascending: false })

  if (error) return new NextResponse(error.message, { status: 500 })

  const winners = data || []
  const chunkSize = 20
  const result: any[] = []

  for (let i = 0; i < winners.length; i += chunkSize) {
    const chunk = winners.slice(i, i + chunkSize)
    const mapped = await Promise.all(
      chunk.map(async (w) => {
        const { data: authData } = await admin.auth.admin.getUserById(w.user_id)
        return {
          ...w,
          profiles: {
            ...w.profiles,
            email: authData.user?.email || null,
          },
        }
      })
    )
    result.push(...mapped)
  }

  return NextResponse.json(result)
}
