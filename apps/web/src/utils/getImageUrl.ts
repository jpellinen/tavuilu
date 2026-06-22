export function getImageUrl(imageRef: string): string {
  const base =
    import.meta.env.VITE_IMAGE_BASE_URL ??
    'https://tavuilu-content-504641295432-eu-north-1-an.s3.eu-north-1.amazonaws.com'
  return `${base}/words/${imageRef}.png`
}
