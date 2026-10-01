function createImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    // Allows cropping a same-origin/CORS-enabled remote photo through canvas
    // without tainting it; harmless for local blob: URLs.
    image.setAttribute('crossOrigin', 'anonymous')
    image.src = url
  })
}

/**
 * Draws the selected crop area of `imageSrc` onto a canvas sized to the crop,
 * then exports it as a JPEG and returns an object URL for the result.
 * `pixelCrop` is the { x, y, width, height } object react-easy-crop reports
 * via its onCropComplete callback (in natural image pixels).
 */
export async function getCroppedImageUrl(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(pixelCrop.width)
  canvas.height = Math.round(pixelCrop.height)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Impossible de créer le contexte canvas.')

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    canvas.width,
    canvas.height,
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Le recadrage a échoué.'))
          return
        }
        resolve(URL.createObjectURL(blob))
      },
      'image/jpeg',
      0.92,
    )
  })
}
