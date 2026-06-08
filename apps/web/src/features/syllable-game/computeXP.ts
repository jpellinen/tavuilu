export function computeXP(
  difficulty: 1 | 2 | 3,
  durationMs: number,
  firstAttempt: boolean
): number {
  const base = difficulty === 1 ? 10 : difficulty === 2 ? 20 : 35
  const speedBonus = firstAttempt && durationMs <= 10_000 ? 5 : 0
  return base + speedBonus
}
