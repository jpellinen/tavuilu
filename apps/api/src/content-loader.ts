import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Word } from '@tavuilu/shared'
import { WordListSchema } from './schemas/index.js'

const packageRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const contentDir = path.join(packageRoot, 'content')

export async function loadWords(lang: string): Promise<Word[]> {
  const filePath = path.join(contentDir, `${lang}.json`)
  const raw = await readFile(filePath, 'utf-8')
  return WordListSchema.parse(JSON.parse(raw)) as Word[]
}
