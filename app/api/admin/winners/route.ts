import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth'

export async function GET() {
  const { role } = await getUser()
  if (role !== 'admin') return new NextResponse('Unauthorized', { status: 401 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('winners')
    .select('*, profiles(id, full_name, auth_users!inner(email)), draws(*)')
    .order('created_at', { ascending: false })

  if (error) return new NextResponse(error.message, { status: 500 })

  // Clean data
  const result = data.map(w => ({
    ...w,
    profiles: {
       ...w.profiles,
       email: (w.profiles as any).auth_users?.email
    }
  }))

  return NextResponse.json(result)
}
