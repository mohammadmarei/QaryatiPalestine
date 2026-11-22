/**
 * Read an image file and return a downscaled JPEG data URL.
 *
 * The demo keeps all data in localStorage (about 5 MB per site), so photos are
 * resized before they are stored. Swap this for a real upload once a backend
 * exists.
 */
export async function imageFileToDataUrl(file: File, maxSize = 1200, quality = 0.82): Promise<string> {
  const src = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image()
    el.onload = () => resolve(el)
    el.onerror = () => reject(new Error('Unreadable image'))
    el.src = src
  })
  const scale = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale))
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale))
  const ctx = canvas.getContext('2d')
  if (!ctx) return src
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', quality)
}
