import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useProgressSync } from './useProgressSync'
import { useProgressStore } from '../stores/progressStore'

vi.mock('../lib/auth-client', () => ({
  authClient: {
    useSession: vi.fn(),
  },
}))

import { authClient } from '../lib/auth-client'

function mockSession(user: Record<string, unknown> | null, isPending = false) {
  vi.mocked(authClient.useSession).mockReturnValue({
    data: user ? { user, session: {} } : null,
    isPending,
  } as never)
}

beforeEach(() => {
  vi.restoreAllMocks()
  vi.stubGlobal('fetch', vi.fn())
  useProgressStore.setState({ xp: 0, level: 1, completedWordIds: [] })
})

describe('useProgressSync', () => {
  it('fetches progress and syncs store when session exists', async () => {
    mockSession({ id: '1', email: 'a@b.com' })
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ xp: 50, level: 1, completedWordIds: ['talo'] }),
    } as Response)

    renderHook(() => useProgressSync())

    await waitFor(() => expect(useProgressStore.getState().xp).toBe(50))
    expect(useProgressStore.getState().completedWordIds).toEqual(['talo'])
  })

  it('does not update the store when the response is not ok', async () => {
    mockSession({ id: '1', email: 'a@b.com' })
    vi.mocked(fetch).mockResolvedValue({ ok: false } as Response)

    renderHook(() => useProgressSync())

    await waitFor(() => expect(fetch).toHaveBeenCalled())
    expect(useProgressStore.getState().xp).toBe(0)
  })

  it('does not fetch while session is pending', () => {
    mockSession(null, true)

    renderHook(() => useProgressSync())

    expect(fetch).not.toHaveBeenCalled()
  })

  it('does not fetch when there is no session', () => {
    mockSession(null, false)

    renderHook(() => useProgressSync())

    expect(fetch).not.toHaveBeenCalled()
  })
})
