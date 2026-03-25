import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { role } = await getUser()
  if (role !== 'admin') return new NextResponse('Unauthorized', { status: 401 })

  const { id } = await params
  const supabase = await createClient()
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [profileRes, subscriptionRes, scoresRes, charityRes, winsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, role, subscription_status, created_at')
      .eq('id', id)
      .single(),
    supabase.from('subscriptions').select('*').eq('user_id', id).maybeSingle(),
    supabase
      .from('scores')
      .select('*')
      .eq('user_id', id)
      .order('played_on', { ascending: false }),
    supabase
      .from('user_charity')
      .select('*, charities(*)')
      .eq('user_id', id)
      .maybeSingle(),
    supabase
      .from('winners')
      .select('*, draws(*)')
      .eq('user_id', id)
      .order('created_at', { ascending: false }),
  ])

  if (profileRes.error) return new NextResponse(profileRes.error.message, { status: 500 })

  const { data: authData } = await admin.auth.admin.getUserById(id)

  return NextResponse.json({
    profile: {
      ...profileRes.data,
      email: authData.user?.email || null,
    },
    subscription: subscriptionRes.data,
    scores: scoresRes.data || [],
    charity: charityRes.data,
    winners: winsRes.data || [],
  })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getUser()
  if (admin.role !== 'admin' || !admin.user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { id } = await params
  const { subscription_status } = await req.json()

  if (!['active', 'inactive', 'lapsed'].includes(subscription_status)) {
    return new NextResponse('Invalid subscription status', { status: 400 })
  }

  const supabase = await createClient()

  const { data: oldProfile } = await supabase
    .from('profiles')
    .select('id, subscription_status')
    .eq('id', id)
    .single()

  const { data, error } = await supabase
    .from('profiles')
    .update({ subscription_status })
    .eq('id', id)
    .select('id, full_name, role, subscription_status')
    .single()

  if (error) return new NextResponse(error.message, { status: 500 })

  await supabase.from('audit_log').insert({
    admin_id: admin.user.id,
    action: 'update_subscription_status',
    target_table: 'profiles',
    target_id: id,
    old_value: oldProfile,
    new_value: data,
  })

  return NextResponse.json(data)
}
