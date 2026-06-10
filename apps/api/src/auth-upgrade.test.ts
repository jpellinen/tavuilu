import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { FastifyInstance, LightMyRequestResponse } from 'fastify'
import { buildApp } from './app.js'
import { prisma } from './lib/prisma.js'

function cookieMap(response: LightMyRequestResponse): Record<string, string> {
  return Object.fromEntries(response.cookies.map((c) => [c.name, c.value]))
}

describe('guest-to-account upgrade', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = await buildApp()
  })

  afterAll(async () => {
    await app.close()
    await prisma.$disconnect()
  })

  it('keeps the existing account progress when an anonymous player logs into it', async () => {
    // 1. Create a registered account with some progress.
    const anonForRegister = await app.inject({ method: 'POST', url: '/api/auth/sign-in/anonymous' })
    const registerCookies = cookieMap(anonForRegister)

    const email = `existing-${anonForRegister.json().user.id}@example.com`
    const password = 'correct horse battery'
    const signUp = await app.inject({
      method: 'POST',
      url: '/api/auth/sign-up/email',
      cookies: registerCookies,
      headers: {
        'content-type': 'application/json',
        origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
      },
      payload: JSON.stringify({ name: 'Existing Parent', email, password }),
    })
    const registeredUser = signUp.json().user as { id: string }
    const registeredCookies = cookieMap(signUp)

    await app.inject({
      method: 'POST',
      url: '/api/progress/round',
      cookies: registeredCookies,
      payload: { wordId: 'kala', durationMs: 5000, correct: true, firstAttempt: true },
    })
    const existingProgress = await (
      await app.inject({ method: 'GET', url: '/api/progress', cookies: registeredCookies })
    ).json()

    try {
      // 2. A new anonymous session plays a round of its own.
      const anonSignIn = await app.inject({ method: 'POST', url: '/api/auth/sign-in/anonymous' })
      const newAnonUser = anonSignIn.json().user as { id: string }
      const anonCookies = cookieMap(anonSignIn)

      await app.inject({
        method: 'POST',
        url: '/api/progress/round',
        cookies: anonCookies,
        payload: { wordId: 'auto', durationMs: 5000, correct: true, firstAttempt: true },
      })

      // 3. That anonymous session logs into the existing registered account.
      const signIn = await app.inject({
        method: 'POST',
        url: '/api/auth/sign-in/email',
        cookies: anonCookies,
        headers: {
          'content-type': 'application/json',
          origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
        },
        payload: JSON.stringify({ email, password }),
      })
      expect(signIn.statusCode).toBe(200)
      const signInCookies = cookieMap(signIn)

      // 4. The existing account's progress is untouched — no merge.
      const progressAfter = await app.inject({
        method: 'GET',
        url: '/api/progress',
        cookies: signInCookies,
      })
      expect(progressAfter.statusCode).toBe(200)
      expect(progressAfter.json()).toEqual(existingProgress)

      // 5. The temporary anonymous user (and its Progress row) was cleaned up.
      const anonUserRow = await prisma.user.findUnique({ where: { id: newAnonUser.id } })
      expect(anonUserRow).toBeNull()
      const anonProgressRow = await prisma.progress.findUnique({
        where: { userId: newAnonUser.id },
      })
      expect(anonProgressRow).toBeNull()
    } finally {
      await prisma.user.delete({ where: { id: registeredUser.id } }).catch(() => {})
    }
  })

  it('preserves progress when an anonymous player registers', async () => {
    // 1. First visit: silent anonymous sign-in.
    const signIn = await app.inject({ method: 'POST', url: '/api/auth/sign-in/anonymous' })
    expect(signIn.statusCode).toBe(200)
    const anonUser = signIn.json().user as { id: string }
    const anonCookies = cookieMap(signIn)

    // 2. Play a round as the anonymous user, earning XP.
    const round = await app.inject({
      method: 'POST',
      url: '/api/progress/round',
      cookies: anonCookies,
      payload: { wordId: 'kala', durationMs: 5000, correct: true, firstAttempt: true },
    })
    expect(round.statusCode).toBe(200)
    const progressBeforeRegister = round.json()
    expect(progressBeforeRegister.xp).toBeGreaterThan(0)
    expect(progressBeforeRegister.completedWordIds).toContain('kala')

    // 3. Register from the same session — better-auth's anonymous plugin links the account.
    const email = `test-${anonUser.id}@example.com`
    const signUp = await app.inject({
      method: 'POST',
      url: '/api/auth/sign-up/email',
      cookies: anonCookies,
      headers: {
        'content-type': 'application/json',
        origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
      },
      payload: JSON.stringify({ name: 'Test Parent', email, password: 'correct horse battery' }),
    })
    expect(signUp.statusCode).toBe(200)
    const registeredUser = signUp.json().user as { id: string; isAnonymous?: boolean | null }
    expect(registeredUser.isAnonymous).toBeFalsy()

    const registeredCookies = cookieMap(signUp)

    try {
      // 4. Progress is intact under the new account — no merge step, nothing lost.
      const progressAfter = await app.inject({
        method: 'GET',
        url: '/api/progress',
        cookies: registeredCookies,
      })
      expect(progressAfter.statusCode).toBe(200)
      expect(progressAfter.json()).toEqual(progressBeforeRegister)

      // 5. The Progress row was reassigned, not duplicated.
      const progressRows = await prisma.progress.findMany({
        where: { userId: { in: [anonUser.id, registeredUser.id] } },
      })
      expect(progressRows).toHaveLength(1)
      expect(progressRows[0].userId).toBe(registeredUser.id)

      // 6. The old anonymous user was cleaned up by better-auth's anonymous plugin.
      const anonUserRow = await prisma.user.findUnique({ where: { id: anonUser.id } })
      expect(anonUserRow).toBeNull()
    } finally {
      await prisma.user.delete({ where: { id: registeredUser.id } }).catch(() => {})
    }
  })
})
