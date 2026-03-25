import test from 'node:test'
import assert from 'node:assert/strict'
import { randomDraw, weightedDraw, matchTier } from './draw-engine'

test('randomDraw returns 5 unique numbers in range', () => {
  const numbers = randomDraw()
  assert.equal(numbers.length, 5)
  assert.equal(new Set(numbers).size, 5)
  for (const n of numbers) {
    assert.ok(n >= 1 && n <= 45)
  }
})

test('weightedDraw returns 5 unique numbers', () => {
  const numbers = weightedDraw([1, 1, 1, 2, 2, 3, 40, 41])
  assert.equal(numbers.length, 5)
  assert.equal(new Set(numbers).size, 5)
})

test('matchTier returns correct tiers', () => {
  assert.equal(matchTier([1, 2, 3, 4, 5], [1, 2, 3, 4, 5]), 5)
  assert.equal(matchTier([1, 2, 3, 4, 6], [1, 2, 3, 4, 5]), 4)
  assert.equal(matchTier([1, 2, 3, 7, 8], [1, 2, 3, 4, 5]), 3)
  assert.equal(matchTier([1, 2, 9, 10, 11], [3, 4, 5, 6, 7]), null)
})
