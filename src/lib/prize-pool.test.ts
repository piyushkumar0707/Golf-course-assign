import test from 'node:test'
import assert from 'node:assert/strict'
import { calculatePool, splitPrize, shouldCarryJackpot } from './prize-pool'

test('calculatePool creates expected split', () => {
  const pool = calculatePool(100, 1000, 5000)
  assert.equal(pool.totalPool, 50000)
  assert.equal(pool.tier4, Math.floor(50000 * 0.35))
  assert.equal(pool.tier3, Math.floor(50000 * 0.25))
  assert.equal(pool.tier5, Math.floor(50000 * 0.4) + 5000)
})

test('splitPrize handles winner counts', () => {
  assert.equal(splitPrize(10000, 0), 0)
  assert.equal(splitPrize(10000, 4), 2500)
})

test('shouldCarryJackpot only when no tier5 winner', () => {
  assert.equal(shouldCarryJackpot(0), true)
  assert.equal(shouldCarryJackpot(1), false)
})
