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
// Caps the exported image at this width so a 4000px phone photo doesn't turn
// into a multi-MB JPEG once cropped — plenty for how product photos are shown.
const MAX_OUTPUT_WIDTH = 1200

export async function getCroppedImageUrl(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc)
  const scale = pixelCrop.width > MAX_OUTPUT_WIDTH ? MAX_OUTPUT_WIDTH / pixelCrop.width : 1
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(pixelCrop.width * scale)
  canvas.height = Math.round(pixelCrop.height * scale)
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
