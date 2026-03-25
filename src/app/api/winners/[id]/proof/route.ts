import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getAuthenticatedUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { proofUrl } = await req.json()
  const supabase = await createClient()

  // Ensure user owns this winner record
  const { data: winner, error: winnerError } = await supabase
    .from('winners')
    .select('user_id, proof_status')
    .eq('id', id)
    .single()

  if (winnerError || !winner) return new NextResponse('Winner record not found', { status: 404 })
  if (winner.user_id !== user.id) return new NextResponse('Forbidden', { status: 403 })

  // Only allow if awaiting or rejected
  if (winner.proof_status !== 'awaiting' && winner.proof_status !== 'rejected') {
    return new NextResponse('Proof already submitted or approved', { status: 400 })
  }

  const { data, error } = await supabase
    .from('winners')
    .update({
      proof_url: proofUrl,
      proof_status: 'pending',
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return new NextResponse(error.message, { status: 500 })

  // TODO: Trigger email to admin for proof review
  return NextResponse.json(data)
}
