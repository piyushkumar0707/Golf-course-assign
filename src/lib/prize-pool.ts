export function calculatePool(subscriberCount: number, pricePerUser: number, jackpotCarryIn: number) {
  // Using 50% of the total revenue as the prize pool.
  const totalSubRevenue = subscriberCount * pricePerUser
  const totalPool = Math.floor(totalSubRevenue * 0.5)
  
  const baseTier5 = Math.floor(totalPool * 0.4)
  const tier4 = Math.floor(totalPool * 0.35)
  const tier3 = Math.floor(totalPool * 0.25)
  
  const tier5 = baseTier5 + jackpotCarryIn
  
  return { 
    totalPool,
    tier5, 
    tier4, 
    tier3 
  }
}

export function splitPrize(tierPool: number, winnerCount: number): number {
  if (winnerCount === 0) return 0
  return Math.floor(tierPool / winnerCount)
}

export function shouldCarryJackpot(tier5Winners: number): boolean {
  return tier5Winners === 0
}
