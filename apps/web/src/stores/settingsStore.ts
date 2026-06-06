import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Language = 'fi' | 'en'
type Difficulty = 1 | 2 | 3

interface SettingsState {
  language: Language
  difficulty: Difficulty
  setLanguage: (lang: Language) => void
  setDifficulty: (difficulty: Difficulty) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: 'fi',
      difficulty: 1,
      setLanguage: (language) => set({ language }),
      setDifficulty: (difficulty) => set({ difficulty }),
    }),
    { name: 'tavuilu-settings' }
  )
)
