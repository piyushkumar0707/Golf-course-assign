import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth'

export async function GET() {
  const { user } = await getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const supabase = await createClient()
  const { data: scores } = await supabase
    .from('scores')
    .select('*')
    .eq('user_id', user.id)
    .order('played_on', { ascending: false })

  return NextResponse.json(scores || [])
}

export async function POST(req: Request) {
  const { user } = await getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { score, played_on } = await req.json()

  const scoreNum = parseInt(score)
  if (isNaN(scoreNum) || scoreNum < 1 || scoreNum > 45) {
    return new NextResponse('Invalid score (must be 1-45)', { status: 400 })
  }

  const playedDate = new Date(played_on)
  const today = new Date()
  today.setHours(23, 59, 59, 999) // End of day for future check
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(today.getFullYear() - 1)

  if (playedDate > today || playedDate < oneYearAgo) {
    return new NextResponse('Invalid date (must be within last 12 months and not in future)', { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('scores')
    .insert({
      user_id: user.id,
      score: scoreNum,
      played_on: playedDate.toISOString().split('T')[0],
    })
    .select()
    .single()

  if (error) return new NextResponse(error.message, { status: 500 })

  return NextResponse.json(data)
}
