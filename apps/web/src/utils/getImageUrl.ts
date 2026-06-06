export function getImageUrl(imageRef: string): string {
  const base = import.meta.env.VITE_IMAGE_BASE_URL ?? 'http://localhost:3000'
  return `${base}/images/words/${imageRef}.png`
}
