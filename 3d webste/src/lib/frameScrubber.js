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

export function preloadFrames(total, basePath, ext, onProgress) {
  const images = new Array(total)
  let loaded = 0

  return new Promise((resolve) => {
    for (let i = 0; i < total; i++) {
      const img = new Image()
      const num = String(i + 1).padStart(4, '0')
      img.src = `${basePath}${num}.${ext}`
      img.onload = img.onerror = () => {
        loaded++
        if (onProgress) onProgress(loaded / total)
        if (loaded === total) resolve(images)
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

  ctx.clearRect(0, 0, cw, ch)
  ctx.drawImage(img, sx, sy, sw, sh)
}
