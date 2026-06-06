import { z } from 'zod';

export const WordSchema = z.object({
  id: z.string(),
  word: z.string(),
  syllables: z.array(z.string()).min(1),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  imageRef: z.string(),
  tags: z.array(z.string()),
});

export const WordListSchema = z.array(WordSchema);
