import { describe, it, expect, afterEach, vi } from 'vitest'
import type { Word } from '@tavuilu/shared'
import { selectNextWord } from './selectNextWord'

function makeWord(id: string): Word {
  return {
    id,
    word: `word-${id}`,
    syllables: ['wo', 'rd'],
    difficulty: 1,
    imageRef: `${id}.png`,
    tags: [],
  }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('selectNextWord', () => {
  it('returns null when there are no words', () => {
    expect(selectNextWord([], [], [])).toBeNull()
  })

  it('picks from the uncompleted pool when enough uncompleted words remain', () => {
    const words = [1, 2, 3, 4, 5, 6, 7].map((n) => makeWord(String(n)))
    vi.spyOn(Math, 'random').mockReturnValue(0)

    const result = selectNextWord(words, ['1', '2'], [])

    expect(result?.id).toBe('3')
  })

  it('falls back to the full word list when fewer than 5 words remain uncompleted', () => {
    const words = [1, 2, 3, 4, 5, 6].map((n) => makeWord(String(n)))
    vi.spyOn(Math, 'random').mockReturnValue(0)

    // Only 3 words are uncompleted, so the pool widens to the full list,
    // and the completed-but-unplayed word '1' becomes a valid pick again.
    const result = selectNextWord(words, ['1', '2', '3'], ['4', '5', '6'])

    expect(result?.id).toBe('1')
  })

  it('avoids words already played this session when alternatives exist', () => {
    const words = [1, 2, 3, 4, 5, 6].map((n) => makeWord(String(n)))
    vi.spyOn(Math, 'random').mockReturnValue(0)

    const result = selectNextWord(words, [], ['1', '2'])

    expect(result?.id).toBe('3')
  })

  it('reshuffles but avoids repeating the most recently played word once the pool is exhausted', () => {
    const words = [1, 2, 3, 4, 5, 6].map((n) => makeWord(String(n)))
    vi.spyOn(Math, 'random').mockReturnValue(0)

    const result = selectNextWord(words, [], ['1', '2', '3', '4', '5', '6'])

    expect(result?.id).toBe('1')
    expect(result?.id).not.toBe('6')
  })

  it('replays the last word when it is the only candidate left', () => {
    const words = [makeWord('1')]
    vi.spyOn(Math, 'random').mockReturnValue(0)

    const result = selectNextWord(words, [], ['1'])

    expect(result?.id).toBe('1')
  })
})
