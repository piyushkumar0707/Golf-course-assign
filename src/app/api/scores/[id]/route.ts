import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getAuthenticatedUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { score, played_on } = await req.json()

  const scoreNum = parseInt(score)
  if (isNaN(scoreNum) || scoreNum < 1 || scoreNum > 45) {
    return new NextResponse('Invalid score', { status: 400 })
  }

  const playedDate = new Date(played_on)
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(today.getFullYear() - 1)

  if (playedDate > today || playedDate < oneYearAgo) {
    return new NextResponse('Invalid date', { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('scores')
    .update({
      score: scoreNum,
      played_on: playedDate.toISOString().split('T')[0],
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return new NextResponse(error.message, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getAuthenticatedUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const supabase = await createClient()
  const { error } = await supabase
    .from('scores')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return new NextResponse(error.message, { status: 500 })
  return new NextResponse('Success', { status: 200 })
}
