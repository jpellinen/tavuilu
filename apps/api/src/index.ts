import Fastify from 'fastify'
import fastifyCors from '@fastify/cors'
import fastifyStatic from '@fastify/static'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Word } from '@tavuilu/shared'
import { loadWords } from './content-loader.js'
import wordsRoute from './routes/words.js'

const app = Fastify({ logger: true })

const port = Number(process.env.PORT) || 3000
const packageRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

await app.register(fastifyCors, {
  origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
})

await app.register(fastifyStatic, {
  root: path.join(packageRoot, 'content', 'images'),
  prefix: '/images/',
})

const wordsByLang = new Map<string, Word[]>()
wordsByLang.set('fi', await loadWords('fi'))

await app.register(wordsRoute, { words: wordsByLang })

app.get('/health', async () => ({ status: 'ok' }))

await app.listen({ port, host: '0.0.0.0' })
