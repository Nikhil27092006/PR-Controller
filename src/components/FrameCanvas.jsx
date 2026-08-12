import React, {
  useRef, useEffect, useState, useCallback
} from 'react'
import { preloadFrames, getFrameIndex, renderFrame } from '../lib/frameScrubber'

const TOTAL_FRAMES = 240
const BASE_PATH    = '/frames/frame_'
const EXT          = 'jpg'

/**
 * FrameCanvas
 * Renders video frames to a <canvas> element driven by scroll position.
 * The canvas is fixed, full-viewport, and cover-fit.
 */
export default function FrameCanvas({ onProgress, onLoaded, onLoadProgress }) {
  const canvasRef   = useRef(null)
  const framesRef   = useRef([])
  const rafRef      = useRef(null)
  const currentIdx  = useRef(0)
  const targetIdx   = useRef(0)
  const [loadPct, setLoadPct] = useState(0)

  // Interactive mouse tracking refs
  const mouseX = useRef(0)
  const mouseY = useRef(0)
  const curMouseX = useRef(0)
  const curMouseY = useRef(0)

  // Keep latest callback refs to prevent effect re-runs when callbacks change
  const onProgressRef = useRef(onProgress)
  const onLoadedRef = useRef(onLoaded)
  const onLoadProgressRef = useRef(onLoadProgress)

  useEffect(() => { onProgressRef.current = onProgress }, [onProgress])
  useEffect(() => { onLoadedRef.current = onLoaded }, [onLoaded])
  useEffect(() => { onLoadProgressRef.current = onLoadProgress }, [onLoadProgress])

  /* ── Track mouse positions ───────────────────── */
  useEffect(() => {
    const handleMouseMove = (e) => {
      // Normalize values between -0.5 and 0.5 relative to viewport center
      mouseX.current = (e.clientX / window.innerWidth) - 0.5
      mouseY.current = (e.clientY / window.innerHeight) - 0.5
    }
    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  /* ── Resize canvas to viewport ───────────────── */
  const resize = useCallback(() => {
    const c = canvasRef.current
    if (!c) return
    c.width  = window.innerWidth  * window.devicePixelRatio
    c.height = window.innerHeight * window.devicePixelRatio
    c.style.width  = `${window.innerWidth}px`
    c.style.height = `${window.innerHeight}px`
    
    // Re-draw current frame after resize
    const frames = framesRef.current
    if (frames.length) {
      const idx = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.round(currentIdx.current)))
      const img = frames[idx]
      if (img) renderFrame(c, img)
    }
  }, [])

  /* ── Preload all frames (exactly once) ───────── */
  useEffect(() => {
    preloadFrames(TOTAL_FRAMES, BASE_PATH, EXT, (pct) => {
      setLoadPct(pct)
      if (onLoadProgressRef.current) onLoadProgressRef.current(pct)
    }).then((images) => {
      framesRef.current = images
      if (onLoadedRef.current) onLoadedRef.current()
      
      // Draw first frame immediately
      const img = images[0]
      if (img && canvasRef.current) renderFrame(canvasRef.current, img)
    })
  }, [])

  /* ── Scroll handler ─────────────────────────── */
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const maxScroll = document.body.scrollHeight - window.innerHeight
      const progress  = maxScroll > 0 ? Math.min(scrollTop / maxScroll, 1) : 0

      targetIdx.current = getFrameIndex(progress, TOTAL_FRAMES)
      if (onProgressRef.current) onProgressRef.current(progress)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // initial
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  /* ── rAF render loop — frame scrubbing & idle parallax ── */
  useEffect(() => {
    const loop = () => {
      rafRef.current = requestAnimationFrame(loop)
      const frames = framesRef.current
      if (!canvasRef.current) return

      // 1. Frame Rendering (Inertia-driven scrolling)
      if (frames.length) {
        const target = targetIdx.current
        const current = currentIdx.current
        const diff = target - current

        if (Math.abs(diff) >= 0.05) {
          const ease = 0.09 // Buttery-smooth scrubbing inertia
          currentIdx.current = current + diff * ease
          const idxToDraw = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.round(currentIdx.current)))
          const img = frames[idxToDraw]
          if (img?.complete) renderFrame(canvasRef.current, img)
        } else if (currentIdx.current !== target) {
          currentIdx.current = target
          const img = frames[target]
          if (img?.complete) renderFrame(canvasRef.current, img)
        }
      }

      // 2. Parallax and Idle Motion (Active when user stops scrolling)
      const mEase = 0.12 // Snappier responsiveness to mouse moves
      curMouseX.current += (mouseX.current - curMouseX.current) * mEase
      curMouseY.current += (mouseY.current - curMouseY.current) * mEase

      const time = performance.now() * 0.001
      // High-energy multi-frequency breathing — visible idle drift
      const breatheX = Math.sin(time * 2.4) * 0.18 + Math.cos(time * 1.1) * 0.09
      const breatheY = Math.cos(time * 2.1) * 0.18 + Math.sin(time * 0.9) * 0.09

      // Large displacement values for a dramatic floating feel
      const finalX = curMouseX.current * 70 + breatheX * 50
      const finalY = curMouseY.current * 70 + breatheY * 50
      const rotateDeg = finalX * 0.06 // More pronounced tilt

      canvasRef.current.style.transform = `scale(1.12) translate3d(${finalX}px, ${finalY}px, 0) rotate(${rotateDeg}deg)`
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  /* ── Window resize ──────────────────────────── */
  useEffect(() => {
    resize()
    window.addEventListener('resize', resize, { passive: true })
    return () => window.removeEventListener('resize', resize)
  }, [resize])

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          inset: 0,
          width:  '100vw',
          height: '100vh',
          display: 'block',
          background: '#020407',
          transition: 'none',
          willChange: 'transform',
        }}
        aria-hidden="true"
      />
      {/* Cinematic overlay: vignette + colour grade */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1,
          background: [
            'radial-gradient(ellipse 90% 65% at 50% 50%, transparent 30%, rgba(2,4,7,0.55) 100%)',
            'linear-gradient(to bottom, rgba(2,4,7,0.60) 0%, transparent 14%, transparent 80%, rgba(2,4,7,0.85) 100%)',
          ].join(', '),
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      />
      {/* Colour tint — deep navy desaturation */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1,
          background: 'rgba(4, 10, 24, 0.22)',
          mixBlendMode: 'multiply',
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      />
    </>
  )
}
