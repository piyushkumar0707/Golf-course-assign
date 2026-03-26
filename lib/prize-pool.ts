/**
 * Golf Charity Platform - Prize Pool
 * Pure functions for financial split calculations in pence/cents (integers).
 * 40/35/25 split ratio.
 */

export function calculatePool(
  subscriberCount: number,
  pricePerUserPence: number, 
  jackpotCarryInPence: number
) {
  // E.g., £10 = 1000 pence
  // Total pot is simply users * price
  const totalSubRevenue = subscriberCount * pricePerUserPence

  // Standard Split: 40% Tier 5, 35% Tier 4, 25% Tier 3
  const poolTier5 = Math.floor(totalSubRevenue * 0.40) + jackpotCarryInPence
  const poolTier4 = Math.floor(totalSubRevenue * 0.35)
  const poolTier3 = Math.floor(totalSubRevenue * 0.25)

  return {
    totalPool: totalSubRevenue,
    tier5: poolTier5,
    tier4: poolTier4,
    tier3: poolTier3
  }
}

export function splitPrize(tierPoolPence: number, winnerCount: number): number {
  if (winnerCount === 0 || tierPoolPence === 0) return 0
  // Integer division
  return Math.floor(tierPoolPence / winnerCount)
}

export function shouldCarryJackpot(tier5Winners: number): boolean {
  return tier5Winners === 0
}
