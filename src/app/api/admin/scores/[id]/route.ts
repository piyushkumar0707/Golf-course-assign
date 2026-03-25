import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { role, user } = await getUser()
  if (!user || role !== 'admin') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { score, played_on, actionType } = await req.json()
  // actionType can be 'update' or 'delete'
  // But wait, the route is PATCH, so it's for update.
  const scoreNum = parseInt(score)

  const supabase = await createClient()

  // get old value for audit logging
  const { data: oldData } = await supabase.from('scores').select('*').eq('id', params.id).single()

  const { data, error } = await supabase
    .from('scores')
    .update({ score: scoreNum, played_on })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return new NextResponse(error.message, { status: 500 })

  // Write to audit_log
  await supabase.from('audit_log').insert({
    admin_id: user.id,
    action: 'update_score',
    target_table: 'scores',
    target_id: params.id,
    old_value: oldData,
    new_value: data,
  })

  return NextResponse.json(data)
}
