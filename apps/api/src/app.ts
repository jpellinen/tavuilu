import Fastify, { type FastifyInstance } from 'fastify'
import fastifyCookie from '@fastify/cookie'
import fastifyCors from '@fastify/cors'
import fastifyStatic from '@fastify/static'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Word } from '@tavuilu/shared'
import { loadWords } from './content-loader.js'
import { auth } from './auth.js'
import wordsRoute from './routes/words.js'
import progressRoute from './routes/progress.js'

declare module 'fastify' {
  interface FastifyRequest {
    userId: string
  }
}

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: true })

  const port = Number(process.env.PORT) || 3000
  const packageRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

  await app.register(fastifyCookie)

  await app.register(fastifyCors, {
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  })

  await app.register(fastifyStatic, {
    root: path.join(packageRoot, 'content', 'images'),
    prefix: '/images/',
  })

  // Keep raw buffer for better-auth; parse JSON for all other routes.
  app.addContentTypeParser('application/json', { parseAs: 'buffer' }, (_req, body, done) => {
    done(null, body)
  })

  app.addHook('preHandler', (request, _reply, done) => {
    if (!request.url.startsWith('/api/auth/') && Buffer.isBuffer(request.body)) {
      try {
        request.body = JSON.parse((request.body as Buffer).toString('utf8'))
      } catch {
        // leave unparsed — route handler's validation will reject it
      }
    }
    done()
  })

  app.all('/api/auth/*', async (request, reply) => {
    const proto = (request.headers['x-forwarded-proto'] as string | undefined) ?? 'http'
    const host = request.headers.host ?? `localhost:${port}`
    const url = new URL(request.url, `${proto}://${host}`)

    const headers = new Headers()
    for (const [key, val] of Object.entries(request.headers)) {
      if (val !== undefined) {
        headers.set(key, Array.isArray(val) ? val.join(', ') : val)
      }
    }

    const hasBody = request.method !== 'GET' && request.method !== 'HEAD'
    const webRequest = new Request(url, {
      method: request.method,
      headers,
      body: hasBody ? (request.body as Buffer) : undefined,
      duplex: hasBody ? 'half' : undefined,
    })

    const response = await auth.handler(webRequest)
    reply.status(response.status)
    response.headers.forEach((value, key) => void reply.header(key, value))
    reply.send(await response.text())
  })

  app.decorateRequest('userId', '')

  const wordsByLang = new Map<string, Word[]>()
  wordsByLang.set('fi', await loadWords('fi'))

  await app.register(wordsRoute, { words: wordsByLang })
  await app.register(progressRoute, { words: wordsByLang })

  app.get('/health', async () => ({ status: 'ok' }))

  return app
}
