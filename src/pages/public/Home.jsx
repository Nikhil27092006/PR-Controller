import React, { useState, useEffect } from 'react'
import Navbar from '../../components/Navbar'
import FrameCanvas from '../../components/FrameCanvas'
import Overlays from '../../components/Overlays'
import { areFramesCached } from '../../lib/frameScrubber'

function LoadingScreen({ done, pct }) {
  return (
    <div className={`loading ${done ? 'out' : ''}`} aria-hidden={done} style={{ pointerEvents: done ? 'none' : 'auto' }}>
      <div className="loading-mark">
        <svg width="24" height="24" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <rect x="1" y="1" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.9" />
          <rect x="11" y="1" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.9" />
          <rect x="1" y="11" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.9" />
          <path d="M14 11.5 L16 13.5 L14 15.5" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M11 13.5 H16" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
      <div className="loading-wordmark">PRFlow Intelligence</div>
      <div className="loading-track">
        <div className="loading-fill" style={{ width: `${Math.round(pct * 100)}%` }} />
      </div>
      <div className="loading-status">
        {pct < 1 ? `Preloading assets: ${Math.round(pct * 100)}%` : 'Initializing workflow...'}
      </div>
    </div>
  )
}

export default function Home() {
  const alreadyCached = areFramesCached()
  const [scrollProgress, setScrollProgress] = useState(0)
  const [loaded, setLoaded] = useState(alreadyCached)
  const [loadPct, setLoadPct] = useState(alreadyCached ? 1 : 0)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Guaranteed 4.5 second initial preloading sequence animation on first ever visit
  useEffect(() => {
    if (alreadyCached) {
      setLoaded(true)
      setLoadPct(1)
      return
    }

    const startTime = Date.now()
    const DURATION = 4500 // 4.5 seconds loading sequence

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const pct = Math.min(elapsed / DURATION, 1)
      setLoadPct(pct)

      if (pct >= 1) {
        clearInterval(interval)
        setLoaded(true)
      }
    }, 40)

    return () => clearInterval(interval)
  }, [alreadyCached])

  // No skip mechanism — user waits for full preload sequence

  return (
    <>
      <LoadingScreen done={loaded} pct={loadPct} />
      <FrameCanvas
        onProgress={setScrollProgress}
      />
      <Navbar scrolled={scrolled} />
      <Overlays scrollProgress={scrollProgress} />
    </>
  )
}
