import { create } from 'zustand'

interface GameHeaderState {
  active: boolean
  wordsCompleted: number
  roundSize: number
  setActive: (active: boolean) => void
  setProgress: (wordsCompleted: number, roundSize: number) => void
}

export const useGameHeaderStore = create<GameHeaderState>()((set) => ({
  active: false,
  wordsCompleted: 0,
  roundSize: 0,
  setActive: (active) => set({ active }),
  setProgress: (wordsCompleted, roundSize) => set({ wordsCompleted, roundSize }),
}))
