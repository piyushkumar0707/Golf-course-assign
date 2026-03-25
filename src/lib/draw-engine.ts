export function randomDraw(): number[] {
  const nums = new Set<number>()
  while (nums.size < 5) {
    nums.add(Math.floor(Math.random() * 45) + 1)
  }
  return Array.from(nums)
}

export function weightedDraw(allScores: number[]): number[] {
  if (allScores.length === 0) return randomDraw()

  const freq: Record<number, number> = {}
  for (const s of allScores) {
    freq[s] = (freq[s] || 0) + 1
  }

  const nums = new Set<number>()
  while (nums.size < 5) {
    const totalWeight = Object.keys(freq).reduce((acc, k) => acc + freq[Number(k)], 0)
    
    if (totalWeight === 0) {
      // Fallback if we run out of non-zero frequencies
      let rNum = Math.floor(Math.random() * 45) + 1
      while (nums.has(rNum)) {
        rNum = Math.floor(Math.random() * 45) + 1
      }
      nums.add(rNum)
      continue
    }

    let r = Math.random() * totalWeight
    let selected = 1
    for (const k in freq) {
      if (r < freq[k]) {
        selected = Number(k)
        break
      }
      r -= freq[k]
    }
    nums.add(selected)
    
    // Set picked number's frequency to 0 so it can't be picked again
    freq[selected] = 0
  }
  return Array.from(nums)
}

export function matchTier(userScores: number[], drawn: number[]): 3 | 4 | 5 | null {
  const drawnSet = new Set(drawn)
  let matches = 0
  for (const s of userScores) {
    if (drawnSet.has(s)) matches++
  }
  if (matches === 5) return 5
  if (matches === 4) return 4
  if (matches === 3) return 3
  return null
}
