import { create } from 'zustand'

interface ProgressState {
  xp: number
  level: number
  completedWordIds: string[]
  addXP: (amount: number) => void
  markWordCompleted: (id: string) => void
  setProgress: (data: { xp: number; level: number; completedWordIds: string[] }) => void
  reset: () => void
}

function levelFromXP(xp: number): number {
  return Math.floor(xp / 100) + 1
}

export const useProgressStore = create<ProgressState>()((set) => ({
  xp: 0,
  level: 1,
  completedWordIds: [],
  addXP: (amount) =>
    set((s) => {
      const xp = s.xp + amount
      return { xp, level: levelFromXP(xp) }
    }),
  markWordCompleted: (id) =>
    set((s) => ({
      completedWordIds: s.completedWordIds.includes(id)
        ? s.completedWordIds
        : [...s.completedWordIds, id],
    })),
  setProgress: (data) => set(data),
  reset: () => set({ xp: 0, level: 1, completedWordIds: [] }),
}))
