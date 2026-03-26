import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { randomDraw, weightedDraw, matchTier } from '@/lib/draw-engine'
import { calculatePool, splitPrize, shouldCarryJackpot } from '@/lib/prize-pool'

export async function POST(req: Request) {
  // Auth check — admin only
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { drawType, month, year, jackpotCarryIn = 0 } = body

  if (!drawType || !month || !year) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Check draw doesn't already exist for this month/year
  const { data: existing } = await supabaseAdmin
    .from('draws')
    .select('id')
    .eq('month', month)
    .eq('year', year)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'A draw for this month/year already exists.' }, { status: 409 })
  }

  // Fetch eligible users (active + 5 scores)
  const { data: activeSubscriptions } = await supabaseAdmin
    .from('subscriptions')
    .select('user_id')
    .eq('status', 'active')

  const userIds = (activeSubscriptions || []).map(s => s.user_id)

  const { data: allScores } = await supabaseAdmin
    .from('scores')
    .select('user_id, score')
    .in('user_id', userIds)

  const userScoreMap: Record<string, number[]> = {}
  for (const row of allScores || []) {
    if (!userScoreMap[row.user_id]) userScoreMap[row.user_id] = []
    userScoreMap[row.user_id].push(row.score)
  }

  const eligibleEntries: { userId: string; scores: number[] }[] = []
  for (const [userId, scores] of Object.entries(userScoreMap)) {
    if (scores.length === 5) {
      eligibleEntries.push({ userId, scores })
    }
  }

  // Run draw
  const allScoreValues = (allScores || []).map(s => s.score)
  const winningNumbers = drawType === 'weighted'
    ? weightedDraw(allScoreValues)
    : randomDraw()

  // Compute results
  const results = eligibleEntries.map(e => ({
    userId: e.userId,
    scores: e.scores,
    tier: matchTier(e.scores, winningNumbers),
  }))

  const pricePerUserPence = 1000
  const pool = calculatePool(eligibleEntries.length, pricePerUserPence, jackpotCarryIn)

  const tier5Winners = results.filter(r => r.tier === 5)
  const tier4Winners = results.filter(r => r.tier === 4)
  const tier3Winners = results.filter(r => r.tier === 3)

  const prizePerTier5 = splitPrize(pool.tier5, tier5Winners.length)
  const prizePerTier4 = splitPrize(pool.tier4, tier4Winners.length)
  const prizePerTier3 = splitPrize(pool.tier3, tier3Winners.length)
  const jackpotCarryOut = shouldCarryJackpot(tier5Winners.length) ? pool.tier5 : 0

  // Persist draw record
  const { data: draw, error: drawErr } = await supabaseAdmin.from('draws').insert({
    month,
    year,
    draw_type: drawType,
    status: 'published',
    winning_numbers: winningNumbers,
    jackpot_carried_in: jackpotCarryIn,
    jackpot_carry_out: jackpotCarryOut,
  }).select().single()

  if (drawErr || !draw) {
    return NextResponse.json({ error: 'Failed to create draw record.' }, { status: 500 })
  }

  // Persist draw entries + prize_pool in parallel
  const entryInserts = eligibleEntries.map(e => ({
    draw_id: draw.id,
    user_id: e.userId,
    scores_snapshot: e.scores,
    tier_matched: results.find(r => r.userId === e.userId)?.tier ?? null,
  }))

  const [{ error: entryErr }, { error: poolErr }] = await Promise.all([
    supabaseAdmin.from('draw_entries').insert(entryInserts),
    supabaseAdmin.from('prize_pool').insert({
      draw_id: draw.id,
      total_pool: pool.totalPool,
      pool_tier_5: pool.tier5,
      pool_tier_4: pool.tier4,
      pool_tier_3: pool.tier3,
      winners_tier_5: tier5Winners.length,
      winners_tier_4: tier4Winners.length,
      winners_tier_3: tier3Winners.length,
    })
  ])

  if (entryErr || poolErr) {
    console.error({ entryErr, poolErr })
  }

  // Persist winners
  const allWinners = [
    ...tier5Winners.map(w => ({ draw_id: draw.id, user_id: w.userId, tier: 5, prize_amount: prizePerTier5 })),
    ...tier4Winners.map(w => ({ draw_id: draw.id, user_id: w.userId, tier: 4, prize_amount: prizePerTier4 })),
    ...tier3Winners.map(w => ({ draw_id: draw.id, user_id: w.userId, tier: 3, prize_amount: prizePerTier3 })),
  ]

  if (allWinners.length > 0) {
    await supabaseAdmin.from('winners').insert(allWinners)
  }

  return NextResponse.json({
    success: true,
    draw,
    winningNumbers,
    eligibleEntrants: eligibleEntries.length,
    winners: { tier5: tier5Winners.length, tier4: tier4Winners.length, tier3: tier3Winners.length },
    jackpotCarryOut,
  })
}
