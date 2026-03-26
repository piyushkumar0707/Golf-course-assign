/**
 * Golf Charity Platform - Draw Engine
 * Implements pure draw algorithms as per PRD.
 */

export function randomDraw(): number[] {
  const result = new Set<number>()
  while (result.size < 5) {
    result.add(Math.floor(Math.random() * 45) + 1)
  }
  return Array.from(result)
}

export function weightedDraw(allScores: number[]): number[] {
  // Step 1: Calculate frequencies
  const frequencies = new Map<number, number>()
  for (const score of allScores) {
    frequencies.set(score, (frequencies.get(score) || 0) + 1)
  }

  // If we don't have enough unique scores to draw 5, fallback to regular random draw 
  // for the remaining numbers to ensure 5 are returned.
  const result = new Set<number>()
  
  // Step 2: Create weighted array
  let pool: number[] = []
  for (const [score, count] of frequencies) {
    // Basic weighting: number appears 'count' times in the pool
    for (let i = 0; i < count; i++) {
      pool.push(score)
    }
  }

  // Step 3: Draw until we have 5 unique
  while (result.size < 5 && pool.length > 0) {
    const randomIndex = Math.floor(Math.random() * pool.length)
    const drawnNumber = pool[randomIndex]
    
    result.add(drawnNumber)
    
    // Remove the drawn number from the pool entirely to avoid duplicates
    pool = pool.filter(n => n !== drawnNumber)
  }

  // Step 4: Fallback if we completely ran out of unique numbers in the weighted pool
  while (result.size < 5) {
    const randomPick = Math.floor(Math.random() * 45) + 1
    result.add(randomPick)
  }

  return Array.from(result)
}

export function matchTier(userScores: number[], drawn: number[]): 3 | 4 | 5 | null {
  let matches = 0
  const drawnSet = new Set(drawn)
  
  for (const score of userScores) {
    if (drawnSet.has(score)) {
      matches++
    }
  }

  if (matches === 5) return 5
  if (matches === 4) return 4
  if (matches === 3) return 3
  
  return null
}
