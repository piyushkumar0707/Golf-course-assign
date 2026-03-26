import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { randomDraw, weightedDraw, matchTier } from '@/lib/draw-engine'
import { calculatePool, splitPrize, shouldCarryJackpot } from '@/lib/prize-pool'

export async function POST(req: Request) {
  // Auth check
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { drawType, month, year, jackpotCarryIn = 0 } = body

  if (!drawType || !month || !year) {
    return NextResponse.json({ error: 'Missing required fields: drawType, month, year' }, { status: 400 })
  }

  // Step 1: Fetch all active subscribers with exactly 5 scores
  const { data: activeSubscriptions } = await supabaseAdmin
    .from('subscriptions')
    .select('user_id')
    .eq('status', 'active')

  if (!activeSubscriptions || activeSubscriptions.length === 0) {
    return NextResponse.json({ error: 'No active subscribers found.' }, { status: 400 })
  }

  // Step 2: Fetch all scores for active users
  const userIds = activeSubscriptions.map(s => s.user_id)
  const { data: allScores } = await supabaseAdmin
    .from('scores')
    .select('user_id, score')
    .in('user_id', userIds)

  if (!allScores) return NextResponse.json({ error: 'Could not fetch scores.' }, { status: 500 })

  // Step 3: Group scores per user and filter those with exactly 5
  const userScoreMap: Record<string, number[]> = {}
  for (const row of allScores) {
    if (!userScoreMap[row.user_id]) userScoreMap[row.user_id] = []
    userScoreMap[row.user_id].push(row.score)
  }

  const eligibleEntries: { userId: string; scores: number[] }[] = []
  for (const [userId, scores] of Object.entries(userScoreMap)) {
    if (scores.length === 5) {
      eligibleEntries.push({ userId, scores })
    }
  }

  if (eligibleEntries.length === 0) {
    return NextResponse.json({ error: 'No eligible users with exactly 5 scores.' }, { status: 400 })
  }

  // Step 4: Run draw algorithm
  const allScoreValues = allScores.map(s => s.score)
  const winningNumbers = drawType === 'weighted'
    ? weightedDraw(allScoreValues)
    : randomDraw()

  // Step 5: Match tiers for every eligible user
  const results = eligibleEntries.map(e => ({
    userId: e.userId,
    scores: e.scores,
    tier: matchTier(e.scores, winningNumbers)
  }))

  // Step 6: Calculate prize pool
  const pricePerUserPence = 1000 // £10 standard entry
  const pool = calculatePool(eligibleEntries.length, pricePerUserPence, jackpotCarryIn)

  const tier5Winners = results.filter(r => r.tier === 5)
  const tier4Winners = results.filter(r => r.tier === 4)
  const tier3Winners = results.filter(r => r.tier === 3)

  const prizePerTier5 = splitPrize(pool.tier5, tier5Winners.length)
  const prizePerTier4 = splitPrize(pool.tier4, tier4Winners.length)
  const prizePerTier3 = splitPrize(pool.tier3, tier3Winners.length)

  const jackpotCarryOut = shouldCarryJackpot(tier5Winners.length) ? pool.tier5 : 0

  return NextResponse.json({
    simulation: true,
    winningNumbers,
    eligibleEntrants: eligibleEntries.length,
    pool: {
      total: pool.totalPool,
      tier5: pool.tier5,
      tier4: pool.tier4,
      tier3: pool.tier3,
    },
    winners: {
      tier5: tier5Winners.map(w => ({ userId: w.userId, prize: prizePerTier5 })),
      tier4: tier4Winners.map(w => ({ userId: w.userId, prize: prizePerTier4 })),
      tier3: tier3Winners.map(w => ({ userId: w.userId, prize: prizePerTier3 })),
    },
    jackpotCarryOut,
  })
}
