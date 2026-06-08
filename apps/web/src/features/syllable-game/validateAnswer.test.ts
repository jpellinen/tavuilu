import { describe, it, expect } from 'vitest'
import { validateAnswer } from './validateAnswer'

describe('validateAnswer', () => {
  it('returns true when slots match syllables in order', () => {
    expect(validateAnswer(['au', 'rin', 'ko'], ['au', 'rin', 'ko'])).toBe(true)
  })

  it('returns false when syllables are in the wrong order', () => {
    expect(validateAnswer(['rin', 'au', 'ko'], ['au', 'rin', 'ko'])).toBe(false)
  })

  it('returns false when a slot has the wrong syllable', () => {
    expect(validateAnswer(['au', 'rin', 'koo'], ['au', 'rin', 'ko'])).toBe(false)
  })

  it('returns false when a slot is empty', () => {
    expect(validateAnswer(['au', '', 'ko'], ['au', 'rin', 'ko'])).toBe(false)
  })

  it('returns true for empty slots and syllables', () => {
    expect(validateAnswer([], [])).toBe(true)
  })
})
