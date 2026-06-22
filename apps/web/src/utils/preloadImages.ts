import type { Word } from '@tavuilu/shared'
import { getImageUrl } from './getImageUrl'

export function preloadImages(words: readonly Word[]): void {
  for (const word of words) {
    const img = new Image()
    img.src = getImageUrl(word.imageRef)
  }
}
