import { describe, it, expect } from 'vitest'
import { computeXP } from './computeXP'

describe('computeXP', () => {
  it('awards base XP per difficulty tier', () => {
    expect(computeXP(1, 20_000, false)).toBe(10)
    expect(computeXP(2, 20_000, false)).toBe(20)
    expect(computeXP(3, 20_000, false)).toBe(35)
  })

  it('adds a speed bonus for a fast first attempt', () => {
    expect(computeXP(1, 10_000, true)).toBe(15)
  })

  it('does not add a speed bonus when the attempt was too slow', () => {
    expect(computeXP(1, 10_001, true)).toBe(10)
  })

  it('does not add a speed bonus when it was not the first attempt', () => {
    expect(computeXP(1, 5_000, false)).toBe(10)
  })
})
