export function validateAnswer(slots: string[], syllables: string[]): boolean {
  return slots.every((chip, i) => chip === syllables[i])
}
