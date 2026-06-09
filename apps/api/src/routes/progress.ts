import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify'
import type { Word } from '@tavuilu/shared'
import { auth } from '../auth.js'
import { prisma } from '../lib/prisma.js'
import { RoundRequestSchema } from '../schemas/index.js'

interface ProgressPluginOptions {
  words: Map<string, Word[]>
}

function levelFromXP(xp: number): number {
  return Math.floor(xp / 100) + 1
}

function computeXP(difficulty: 1 | 2 | 3, durationMs: number, firstAttempt: boolean): number {
  const base = difficulty === 1 ? 10 : difficulty === 2 ? 20 : 35
  const speedBonus = firstAttempt && durationMs <= 10_000 ? 5 : 0
  return base + speedBonus
}

async function requireSession(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const headers = new Headers()
  for (const [key, val] of Object.entries(request.headers)) {
    if (val !== undefined) {
      headers.set(key, Array.isArray(val) ? val.join(', ') : val)
    }
  }
  const session = await auth.api.getSession({ headers })
  if (!session) {
    await reply.status(401).send({ error: 'Unauthorized' })
    return
  }
  request.userId = session.user.id
}

const progressRoute: FastifyPluginAsync<ProgressPluginOptions> = async (fastify, opts) => {
  const allWords = new Map<string, Word>()
  for (const wordList of opts.words.values()) {
    for (const word of wordList) {
      allWords.set(word.id, word)
    }
  }

  fastify.get('/api/progress', { preHandler: requireSession }, async (request) => {
    const row = await prisma.progress.findUnique({
      where: { userId: request.userId },
    })
    if (!row) return { xp: 0, level: 1, completedWordIds: [] }
    return { xp: row.xp, level: row.level, completedWordIds: row.completedWordIds }
  })

  fastify.post('/api/progress/round', { preHandler: requireSession }, async (request, reply) => {
    const result = RoundRequestSchema.safeParse(request.body)
    if (!result.success) {
      return reply.status(400).send({ error: 'Invalid request body' })
    }
    const { wordId, durationMs, correct, firstAttempt } = result.data
    const userId = request.userId

    const word = allWords.get(wordId)
    if (!word) {
      return reply.status(400).send({ error: 'Unknown wordId' })
    }

    if (!correct) {
      const row = await prisma.progress.findUnique({ where: { userId } })
      if (!row) return { xp: 0, level: 1, completedWordIds: [] }
      return { xp: row.xp, level: row.level, completedWordIds: row.completedWordIds }
    }

    const current = await prisma.progress.findUnique({ where: { userId } })
    const newXp = (current?.xp ?? 0) + computeXP(word.difficulty, durationMs, firstAttempt)
    const completedWordIds = [...new Set([...(current?.completedWordIds ?? []), wordId])]
    const level = levelFromXP(newXp)

    const updated = await prisma.progress.upsert({
      where: { userId },
      update: { xp: newXp, level, completedWordIds },
      create: { userId, xp: newXp, level, completedWordIds },
    })

    return {
      xp: updated.xp,
      level: updated.level,
      completedWordIds: updated.completedWordIds,
    }
  })
}

export default progressRoute
