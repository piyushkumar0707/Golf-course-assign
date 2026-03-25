import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const [scoresResult, charityResult] = await Promise.all([
    supabase
      .from('scores')
      .select('id, score, played_on')
      .eq('user_id', user.id)
      .order('played_on', { ascending: false })
      .limit(5),
    supabase
      .from('user_charity')
      .select('charity_id, contribution_pct, charities(name, description)')
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  if (scoresResult.error) {
    return new NextResponse(scoresResult.error.message, { status: 500 })
  }

  if (charityResult.error) {
    return new NextResponse(charityResult.error.message, { status: 500 })
  }

  return NextResponse.json(
    {
      scores: scoresResult.data || [],
      userCharity: charityResult.data || null,
    },
    {
      headers: {
        // Browser-side private caching for faster dashboard revisits.
        'Cache-Control': 'private, max-age=15, stale-while-revalidate=30',
      },
    }
  )
}
