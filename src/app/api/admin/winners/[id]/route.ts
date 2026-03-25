import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { role } = await getUser()
  if (role !== 'admin') return new NextResponse('Unauthorized', { status: 401 })

  const { proof_status, payment_status, rejection_reason } = await req.json()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('winners')
    .update({
      proof_status,
      payment_status,
      rejection_reason,
    })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return new NextResponse(error.message, { status: 500 })

  // TODO: Trigger relevant emails based on status change
  return NextResponse.json(data)
}
