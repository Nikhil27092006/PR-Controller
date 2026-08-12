import React, { useState, useEffect } from 'react'
import Navbar from '../../components/Navbar'
import FrameCanvas from '../../components/FrameCanvas'
import Overlays from '../../components/Overlays'

function LoadingScreen({ done, pct }) {
  return (
    <div className={`loading ${done ? 'out' : ''}`} aria-hidden={done}>
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
  const [scrollProgress, setScrollProgress] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const [loadPct, setLoadPct] = useState(0)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <LoadingScreen done={loaded} pct={loadPct} />
      <FrameCanvas
        onProgress={setScrollProgress}
        onLoadProgress={setLoadPct}
        onLoaded={() => setLoaded(true)}
      />
      <Navbar scrolled={scrolled} />
      <Overlays scrollProgress={scrollProgress} />
    </>
  )
}
