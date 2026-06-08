import type { Word } from '@tavuilu/shared'

const MIN_UNCOMPLETED_POOL = 5

export function selectNextWord(
  words: readonly Word[],
  completedIds: readonly string[],
  sessionPlayed: readonly string[]
): Word | null {
  if (words.length === 0) return null

  const completedSet = new Set(completedIds)
  const uncompleted = words.filter((word) => !completedSet.has(word.id))
  const pool = uncompleted.length >= MIN_UNCOMPLETED_POOL ? uncompleted : words

  const playedSet = new Set(sessionPlayed)
  const unused = pool.filter((word) => !playedSet.has(word.id))
  if (unused.length > 0) {
    return unused[Math.floor(Math.random() * unused.length)]
  }

  const lastPlayedId = sessionPlayed[sessionPlayed.length - 1]
  const reshuffled = pool.filter((word) => word.id !== lastPlayedId)
  const candidates = reshuffled.length > 0 ? reshuffled : pool
  return candidates[Math.floor(Math.random() * candidates.length)]
}
