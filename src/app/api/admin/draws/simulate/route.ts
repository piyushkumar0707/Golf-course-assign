import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth'
import { randomDraw, weightedDraw, matchTier } from '@/lib/draw-engine'
import { calculatePool, splitPrize } from '@/lib/prize-pool'

export async function POST(req: Request) {
  const { role } = await getUser()
  if (role !== 'admin') return new NextResponse('Unauthorized', { status: 401 })

  const { month, year, draw_type } = await req.json()
  const supabase = await createClient()

  // 1. Get eligible users
  const { data: profiles } = await supabase.from('profiles').select('id').eq('subscription_status', 'active')
  if (!profiles) return new NextResponse('No active subscribers', { status: 400 })

  const eligibleUsers = []
  const allScores: number[] = []
  const profileIds = profiles.map((p) => p.id)

  const { data: scoreRows } = await supabase
    .from('scores')
    .select('user_id, score, played_on')
    .in('user_id', profileIds)
    .order('played_on', { ascending: false })

  const scoresByUser = new Map<string, number[]>()
  for (const row of scoreRows || []) {
    const current = scoresByUser.get(row.user_id) || []
    if (current.length < 5) {
      current.push(row.score)
      scoresByUser.set(row.user_id, current)
    }
  }

  for (const profile of profiles) {
    const uScores = scoresByUser.get(profile.id) || []
    if (uScores.length === 5) {
      eligibleUsers.push({ id: profile.id, scores: uScores })
      allScores.push(...uScores)
    }
  }

  // 2. Draw numbers
  const winningNumbers = draw_type === 'weighted' ? weightedDraw(allScores) : randomDraw()

  // 3. Match tiers
  const matches = { 5: 0, 4: 0, 3: 0 }
  const userMatches: any[] = []

  for (const user of eligibleUsers) {
    const tier = matchTier(user.scores, winningNumbers)
    if (tier) {
      matches[tier]++
      userMatches.push({ userId: user.id, tier })
    }
  }

  // 4. Calculate pools
  const { data: lastDraw } = await supabase
    .from('draws')
    .select('jackpot_carry_out')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const carryIn = lastDraw?.jackpot_carry_out || 0
  const pricePerUser = 1000 // Wait: PRD doesn't exacty give the logic to fetch price. Let's hardcode 10 GBP (1000 pence)
  
  const pools = calculatePool(profiles.length, pricePerUser, carryIn)

  const prizes = {
    5: splitPrize(pools.tier5, matches[5]),
    4: splitPrize(pools.tier4, matches[4]),
    3: splitPrize(pools.tier3, matches[3]),
  }

  return NextResponse.json({
    winningNumbers,
    eligibleCount: eligibleUsers.length,
    matches,
    pools,
    prizes,
    userMatches
  })
}
