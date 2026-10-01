async function loadBitmap(file: Blob): Promise<ImageBitmap | HTMLImageElement> {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' })
    } catch {
      /* fall through to <img> */
    }
  }
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    return img
  } finally {
    URL.revokeObjectURL(url)
  }
}

function draw(src: ImageBitmap | HTMLImageElement, maxSize: number, quality: number): Promise<Blob> {
  const w = 'naturalWidth' in src ? src.naturalWidth : src.width
  const h = 'naturalHeight' in src ? src.naturalHeight : src.height
  const scale = Math.min(1, maxSize / Math.max(w, h))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(w * scale)
  canvas.height = Math.round(h * scale)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(src, 0, 0, canvas.width, canvas.height)
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not encode image'))), 'image/jpeg', quality),
  )
}

/** Compress to ~1200px for viewing plus a small thumbnail for lists, pins and previews. */
export async function compressImage(file: Blob): Promise<{ blob: Blob; thumb: Blob }> {
  const src = await loadBitmap(file)
  const [blob, thumb] = await Promise.all([draw(src, 1200, 0.82), draw(src, 360, 0.75)])
  if ('close' in src) src.close()
  return { blob, thumb }
}

export async function fetchImageBlob(url: string): Promise<Blob> {
  const res = await fetch(url, { mode: 'cors', referrerPolicy: 'no-referrer' })
  if (!res.ok) throw new Error(`Image download failed (${res.status})`)
  const blob = await res.blob()
  if (!blob.type.startsWith('image/')) throw new Error('Not an image')
  return blob
}
