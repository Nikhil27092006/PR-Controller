/**
 * useFrameScrubber — Apple-style video frame scrubbing via scroll
 *
 * Loads an image sequence into memory, then renders the
 * appropriate frame onto a <canvas> as the user scrolls.
 *
 * @param {HTMLCanvasElement} canvas  - ref to canvas element
 * @param {number}            total   - total number of frames
 * @param {string}            basePath - e.g. "/frames/frame_"
 * @param {string}            ext      - e.g. "jpg"
 * @param {number}            scrollY  - current window.scrollY
 * @param {number}            maxScroll - document scroll height - window height
 */

let globalCachedFrames = null

export function areFramesCached() {
  return globalCachedFrames !== null && globalCachedFrames.length > 0
}

export function getCachedFrames() {
  return globalCachedFrames
}

export function preloadFrames(total, basePath, ext, onProgress, onFirstFrame, imagesArray) {
  // If frames are already in memory from a previous page visit, populate
  // the caller's array immediately and resolve instantly.
  if (globalCachedFrames && globalCachedFrames.length === total) {
    if (imagesArray) {
      for (let i = 0; i < total; i++) {
        imagesArray[i] = globalCachedFrames[i]
      }
    }
    if (onFirstFrame) onFirstFrame()
    if (onProgress) onProgress(1)
    return Promise.resolve(globalCachedFrames)
  }

  // Use a caller-supplied array when provided so frames are accessible as
  // they load (not just when all are done). Otherwise allocate internally.
  const images = imagesArray || new Array(total)
  let loaded = 0
  let failed = 0
  let firstFrameLoaded = false

  return new Promise((resolve, reject) => {
    for (let i = 0; i < total; i++) {
      const img = new Image()
      const num = String(i + 1).padStart(4, '0')
      img.src = `${basePath}${num}.${ext}`
      img.onload = () => {
        loaded++
        if (!firstFrameLoaded && i === 0) {
          firstFrameLoaded = true
          if (onFirstFrame) onFirstFrame()
        }
        if (onProgress) onProgress(loaded / total)
        if (loaded + failed === total) {
          if (loaded === 0) {
            reject(new Error('All frames failed to load'))
          } else {
            globalCachedFrames = images
            resolve(images)
          }
        }
      }
      img.onerror = () => {
        failed++
        if (onProgress) onProgress((loaded + failed) / total)
        if (loaded + failed === total) {
          if (loaded === 0) {
            reject(new Error('All frames failed to load'))
          } else {
            globalCachedFrames = images
            resolve(images)
          }
        }
      }
      images[i] = img
    }
  })
}

export function getFrameIndex(scrollProgress, totalFrames) {
  const idx = Math.min(
    Math.floor(scrollProgress * (totalFrames - 1)),
    totalFrames - 1,
  )
  return Math.max(0, idx)
}

export function renderFrame(canvas, img) {
  if (!canvas || !img || !img.complete || img.naturalWidth === 0) return
  const ctx = canvas.getContext('2d')
  const cw = canvas.width
  const ch = canvas.height
  const iw = img.naturalWidth
  const ih = img.naturalHeight

  // Cover-fit: fill canvas preserving aspect ratio
  const scale = Math.max(cw / iw, ch / ih)
  const sw = iw * scale
  const sh = ih * scale
  const sx = (cw - sw) / 2
  const sy = (ch - sh) / 2

  ctx.globalAlpha = 1.0
  ctx.clearRect(0, 0, cw, ch)
  ctx.drawImage(img, sx, sy, sw, sh)
}

/**
 * Renders adjacent frames with GPU sub-frame alpha blending for ultra-smooth video scrubbing.
 */
export function renderFrameInterpolated(canvas, imgA, imgB, fraction) {
  if (!canvas || !imgA || !imgA.complete || imgA.naturalWidth === 0) return
  const ctx = canvas.getContext('2d')
  const cw = canvas.width
  const ch = canvas.height
  const iw = imgA.naturalWidth
  const ih = imgA.naturalHeight

  const scale = Math.max(cw / iw, ch / ih)
  const sw = iw * scale
  const sh = ih * scale
  const sx = (cw - sw) / 2
  const sy = (ch - sh) / 2

  ctx.clearRect(0, 0, cw, ch)
  ctx.globalAlpha = 1.0
  ctx.drawImage(imgA, sx, sy, sw, sh)

  if (imgB && imgB.complete && imgB.naturalWidth > 0 && fraction > 0.005) {
    ctx.globalAlpha = Math.min(Math.max(fraction, 0), 1)
    ctx.drawImage(imgB, sx, sy, sw, sh)
    ctx.globalAlpha = 1.0
  }
}
