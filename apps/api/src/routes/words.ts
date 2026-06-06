import type { FastifyPluginAsync } from 'fastify'
import type { Word } from '@tavuilu/shared'

interface WordsPluginOptions {
  words: Map<string, Word[]>
}

interface WordsQuery {
  lang?: string
  difficulty?: string
}

const wordsRoute: FastifyPluginAsync<WordsPluginOptions> = async (fastify, opts) => {
  fastify.get<{ Querystring: WordsQuery }>('/api/words', async (request) => {
    const lang = request.query.lang ?? 'fi'
    const difficulty = request.query.difficulty ? Number(request.query.difficulty) : undefined

    const allWords = opts.words.get(lang) ?? []
    if (difficulty !== undefined) {
      return allWords.filter((w) => w.difficulty === difficulty)
    }
    return allWords
  })
}

export default wordsRoute
