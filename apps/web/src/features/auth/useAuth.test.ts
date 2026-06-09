import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useAuth } from './useAuth'

vi.mock('../../lib/auth-client', () => ({
  authClient: {
    useSession: vi.fn(),
    signIn: { anonymous: vi.fn().mockResolvedValue({}) },
  },
}))

import { authClient } from '../../lib/auth-client'

function mockSession(user: Record<string, unknown> | null, isPending = false) {
  vi.mocked(authClient.useSession).mockReturnValue({
    data: user ? { user, session: {} } : null,
    isPending,
    error: null,
    isRefetching: false,
    refetch: vi.fn(),
  } as never)
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useAuth — isAnonymous', () => {
  it('is false when session user has isAnonymous: null', () => {
    mockSession({ id: '1', email: 'a@b.com', isAnonymous: null })
    const { result } = renderHook(() => useAuth())
    expect(result.current.isAnonymous).toBe(false)
    expect(result.current.loading).toBe(false)
  })

  it('is false when session user has isAnonymous: false', () => {
    mockSession({ id: '1', email: 'a@b.com', isAnonymous: false })
    const { result } = renderHook(() => useAuth())
    expect(result.current.isAnonymous).toBe(false)
  })

  it('is true when session user has isAnonymous: true', () => {
    mockSession({ id: 'anon-1', email: null, isAnonymous: true })
    const { result } = renderHook(() => useAuth())
    expect(result.current.isAnonymous).toBe(true)
  })

  it('is true and loading while session is pending', () => {
    mockSession(null, true)
    const { result } = renderHook(() => useAuth())
    expect(result.current.loading).toBe(true)
    expect(result.current.isAnonymous).toBe(true)
  })

  it('triggers anonymous sign-in when there is no session', async () => {
    mockSession(null, false)
    renderHook(() => useAuth())
    await waitFor(() => expect(authClient.signIn.anonymous).toHaveBeenCalledOnce())
  })

  it('does not trigger anonymous sign-in when a session exists', () => {
    mockSession({ id: '1', email: 'a@b.com', isAnonymous: false })
    renderHook(() => useAuth())
    expect(authClient.signIn.anonymous).not.toHaveBeenCalled()
  })
})

describe('useAuth — user data', () => {
  it('exposes user data from the session', () => {
    mockSession({ id: '42', email: 'test@example.com', isAnonymous: false })
    const { result } = renderHook(() => useAuth())
    expect(result.current.user).toEqual({ id: '42', email: 'test@example.com', isAnonymous: false })
  })
})
