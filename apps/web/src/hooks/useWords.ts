import { useState, useEffect } from 'react'
import type { Word } from '@tavuilu/shared'

type UseWordsResult = {
  words: Word[]
  loading: boolean
  error: string | null
}

export function useWords(lang: string, difficulty: 1 | 2 | 3): UseWordsResult {
  const [state, setState] = useState<UseWordsResult>({
    words: [],
    loading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false

    fetch(`/api/words?lang=${lang}&difficulty=${difficulty}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<Word[]>
      })
      .then((data) => {
        if (!cancelled) setState({ words: data, loading: false, error: null })
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setState({
            words: [],
            loading: false,
            error: err instanceof Error ? err.message : 'Unknown error',
          })
      })

    return () => {
      cancelled = true
    }
  }, [lang, difficulty])

  return state
}
