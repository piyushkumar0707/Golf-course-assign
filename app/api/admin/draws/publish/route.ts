import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth'
import { randomDraw, weightedDraw, matchTier } from '@/lib/draw-engine'
import { calculatePool, splitPrize, shouldCarryJackpot } from '@/lib/prize-pool'

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

  for (const profile of profiles) {
    const { data: userScores } = await supabase
      .from('scores')
      .select('score')
      .eq('user_id', profile.id)
      .order('played_on', { ascending: false })
      .limit(5)

    if (userScores && userScores.length === 5) {
      const uScores = userScores.map(s => s.score)
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
      userMatches.push({ userId: user.id, tier, scores: user.scores })
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
  const pricePerUser = 1000
  const pools = calculatePool(profiles.length, pricePerUser, carryIn)

  const prizes = {
    5: splitPrize(pools.tier5, matches[5]),
    4: splitPrize(pools.tier4, matches[4]),
    3: splitPrize(pools.tier3, matches[3]),
  }

  const carryOut = shouldCarryJackpot(matches[5]) ? pools.tier5 : 0

  // 5. Save to DB
  // Draw
  const { data: draw, error: drawError } = await supabase.from('draws').insert({
    month,
    year,
    draw_type,
    status: 'published',
    winning_numbers: winningNumbers,
    jackpot_carried_in: carryIn,
    jackpot_carry_out: carryOut
  }).select().single()

  if (drawError) return new NextResponse(`Error: ${drawError.message}`, { status: 500 })

  // Prize Pool
  await supabase.from('prize_pool').insert({
    draw_id: draw.id,
    total_pool: pools.totalPool,
    pool_tier_5: pools.tier5,
    pool_tier_4: pools.tier4,
    pool_tier_3: pools.tier3,
    winners_tier_5: matches[5],
    winners_tier_4: matches[4],
    winners_tier_3: matches[3],
  })

  // Draw Entries
  for (const user of eligibleUsers) {
    const matchedTier = matchTier(user.scores, winningNumbers)
    await supabase.from('draw_entries').insert({
      draw_id: draw.id,
      user_id: user.id,
      scores_snapshot: user.scores,
      tier_matched: matchedTier || null
    })
  }

  // Winners
  for (const match of userMatches) {
    await supabase.from('winners').insert({
      draw_id: draw.id,
      user_id: match.userId,
      tier: match.tier,
      prize_amount: prizes[match.tier as 3|4|5]
    })
    // // TODO: send email to winner
  }

  return NextResponse.json(draw)
}
