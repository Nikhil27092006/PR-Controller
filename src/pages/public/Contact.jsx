import React, { useState, useRef, useEffect } from 'react'
import Navbar from '../../components/Navbar'
import { useApp } from '../../store/AppContext'
import { gsap } from 'gsap'

const OWNER_EMAIL = 'ns0312950@gmail.com'
const OWNER_PHONE = '9405808956'

// ─── Paper Airplane Flight Overlay ───────────────────────────────────────────
function SubmitPlaneAnimation({ active }) {
  const planeRef = useRef(null)

  useEffect(() => {
    if (active) {
      const tl = gsap.timeline()
      // Setup initial state: offscreen, small, angled
      tl.set(planeRef.current, { x: -40, y: 180, scale: 0.1, rotation: -20, opacity: 0 })
      
      // Flight trajectory animation
      tl.to(planeRef.current, {
        opacity: 1,
        scale: 1,
        x: '110%',
        y: -120,
        rotation: -45,
        duration: 1.5,
        ease: 'power2.inOut'
      })
    }
  }, [active])

  if (!active) return null

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: 'rgba(2, 4, 10, 0.88)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      zIndex: 10,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 'inherit',
      overflow: 'hidden'
    }}>
      <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg
          ref={planeRef}
          width="52"
          height="52"
          viewBox="0 0 24 24"
          fill="none"
          stroke="url(#plane-color)"
          strokeWidth="1.5"
          style={{ position: 'absolute', left: '10%', bottom: '15%', zIndex: 12 }}
        >
          <defs>
            <linearGradient id="plane-color" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
          </defs>
          <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div style={{
          textAlign: 'center',
          color: 'var(--cyan-400)',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.8rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          fontWeight: 600,
          animation: 'pulse 1.5s infinite ease-in-out'
        }}>
          Sending message...
        </div>
      </div>
    </div>
  )
}

// ─── Contact Info Clickable Card ─────────────────────────────────────────────
function InfoCard({ title, value, type, icon, color, href }) {
  const { showToast } = useApp()
  const cardRef = useRef(null)

  const handleCopy = (e) => {
    if (href) return // standard link behavior
    e.preventDefault()
    navigator.clipboard?.writeText(value).then(() => {
      showToast(`Copied ${type} to clipboard!`, 'success')
      // Custom bump hover animation on copy
      gsap.fromTo(cardRef.current, { scale: 0.98 }, { scale: 1, duration: 0.3, ease: 'elastic.out(1.2, 0.5)' })
    })
  }

  return (
    <a
      ref={cardRef}
      href={href || '#'}
      onClick={handleCopy}
      className="glass"
      style={{
        padding: '1.25rem 1.375rem',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '1rem',
        borderColor: `${color}30`,
        transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
        textDecoration: 'none',
        cursor: 'pointer'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.borderColor = color
        e.currentTarget.style.boxShadow = `0 4px 20px ${color}10`
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'none'
        e.currentTarget.style.borderColor = `${color}30`
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <div
        style={{
          background: `${color}15`,
          border: `1px solid ${color}35`,
          color: color,
          fontSize: '1rem',
          width: 32,
          height: 32,
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
        <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-100)', marginBottom: '0.2rem' }}>{title}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color, marginBottom: '0.2rem', display: 'block', wordBreak: 'break-all' }}>
          {value}
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-40)' }}>
          {href ? 'Click to navigate' : 'Click to copy to clipboard'}
        </div>
      </div>
    </a>
  )
}

export default function Contact() {
  const { showToast } = useApp()
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  const successBadgeRef = useRef(null)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitting(true)

    // Trigger airplane animation delay
    setTimeout(() => {
      const body = encodeURIComponent(
        `Name: ${form.name}\nFrom: ${form.email}\n\n${form.message}`
      )
      const subject = encodeURIComponent(form.subject || 'PRFlow Contact Form')
      const mailtoLink = `mailto:${OWNER_EMAIL}?subject=${subject}&body=${body}`

      window.location.href = mailtoLink
      
      setSubmitting(false)
      setSubmitted(true)
      showToast('Redirecting to your mail client...', 'info')
    }, 1600)
  }

  // Elastic bounce success badge
  useEffect(() => {
    if (submitted && successBadgeRef.current) {
      gsap.fromTo(successBadgeRef.current,
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.65, ease: 'back.out(1.8)' }
      )
    }
  }, [submitted])

  return (
    <div className="public-page-bg" style={{ minHeight: '100vh', background: 'radial-gradient(circle at 50% 0%, rgba(15, 23, 42, 0.4) 0%, var(--bg-void) 80%)' }}>
      <Navbar scrolled />

      <div style={{ paddingTop: 'var(--nav-h)' }}>
        {/* Hero */}
        <div className="public-page-hero" style={{ padding: '4rem 1rem 2rem' }}>
          <span className="eyebrow" style={{ display: 'inline-flex', alignItems: 'center' }}>
            <span className="eyebrow-pulse" style={{ background: '#22d3ee', boxShadow: '0 0 8px #22d3ee' }} />
            Get In Touch
          </span>
          <h1 className="display-lg" style={{ marginTop: '1.5rem', marginBottom: '1.25rem' }}>
            Contact <span className="grad-blue-cyan">Us</span>
          </h1>
          <p className="body-lg" style={{ maxWidth: 500, margin: '0 auto' }}>
            Have a question about PRFlow? We'd love to hear from you — reach out directly and we'll respond as soon as possible.
          </p>
        </div>

        {/* Body columns */}
        <div className="public-page-body" style={{ maxWidth: 960, margin: '0 auto', padding: '0 2rem 6rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem', alignItems: 'start' }}>

            {/* Left: Contact Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ marginBottom: '0.5rem', textAlign: 'left' }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.0625rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-100)', marginBottom: '0.375rem' }}>
                  Direct Contact Slots
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-40)', lineHeight: 1.6 }}>
                  Reach out using phone, email client, or fill in the secure message form.
                </div>
              </div>

              {/* Copy Cards */}
              <InfoCard
                title="Email Address"
                value={OWNER_EMAIL}
                type="email"
                icon="✉"
                color="#22d3ee"
              />

              <InfoCard
                title="Direct Phone"
                value={`+91 ${OWNER_PHONE}`}
                type="phone"
                icon="✆"
                color="#3b82f6"
                href={`tel:+91${OWNER_PHONE}`}
              />

              {/* SLA Response card */}
              <div className="glass" style={{
                padding: '1.125rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(34,211,238,0.02)',
                borderColor: 'rgba(34,211,238,0.12)',
                textAlign: 'left'
              }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--cyan-400)', marginBottom: '0.5rem', fontWeight: 600 }}>
                  Response Time SLA
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-60)', lineHeight: 1.6 }}>
                  We typically respond within <strong style={{ color: 'var(--text-100)' }}>one business day</strong>. Calling is the fastest way to reach us directly.
                </div>
              </div>
            </div>

            {/* Right: Contact Form */}
            <div
              className="glass"
              style={{
                borderRadius: 'var(--radius-lg)',
                padding: '2.5rem',
                background: 'linear-gradient(135deg, rgba(8,14,28,0.9) 0%, rgba(37,99,235,0.02) 100%)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Paper airplane anim overlay */}
              <SubmitPlaneAnimation active={submitting} />

              {submitted ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                  <div
                    ref={successBadgeRef}
                    style={{
                      width: 54, height: 54, borderRadius: '50%',
                      background: 'rgba(52,211,153,0.12)', border: '2px solid #34d399',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#34d399', fontSize: '1.5rem', margin: '0 auto 1.25rem',
                      boxShadow: '0 0 20px rgba(52,211,153,0.25)'
                    }}
                  >
                    ✓
                  </div>
                  <h3 style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '1.375rem',
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    color: '#34d399',
                    marginBottom: '0.75rem',
                  }}>
                    Redirecting to Mail...
                  </h3>
                  <p className="body-md" style={{ maxWidth: 340, margin: '0 auto 2rem', fontSize: '0.85rem' }}>
                    Your default email application is pre-filling the message body. Send the message once opened!
                  </p>
                  <button
                    onClick={() => { setSubmitted(false); setForm({ name: '', email: '', subject: '', message: '' }) }}
                    className="btn btn-outline-glow"
                    style={{ margin: '0 auto' }}
                  >
                    Compose Another Message
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: '2rem', textAlign: 'left' }}>
                    <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-100)', marginBottom: '0.375rem' }}>
                      Send us a message
                    </h2>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-40)' }}>
                      Complete the form details — it will trigger your system email client pre-filled.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem', textAlign: 'left' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-field">
                        <label className="form-label" htmlFor="contact-name">Full Name</label>
                        <input
                          id="contact-name"
                          name="name"
                          type="text"
                          placeholder="Your Name"
                          required
                          value={form.name}
                          onChange={handleChange}
                          className="form-input"
                          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                        />
                      </div>
                      <div className="form-field">
                        <label className="form-label" htmlFor="contact-email">Your Email</label>
                        <input
                          id="contact-email"
                          name="email"
                          type="email"
                          placeholder="you@example.com"
                          required
                          value={form.email}
                          onChange={handleChange}
                          className="form-input"
                          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                        />
                      </div>
                    </div>

                    <div className="form-field">
                      <label className="form-label" htmlFor="contact-subject">Subject</label>
                      <input
                        id="contact-subject"
                        name="subject"
                        type="text"
                        placeholder="What's this about?"
                        value={form.subject}
                        onChange={handleChange}
                        className="form-input"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                      />
                    </div>

                    <div className="form-field">
                      <label className="form-label" htmlFor="contact-message">Message</label>
                      <textarea
                        id="contact-message"
                        name="message"
                        rows={5}
                        placeholder="Describe your question or feedback in detail..."
                        required
                        value={form.message}
                        onChange={handleChange}
                        className="form-input form-textarea"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', minHeight: 120 }}
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary btn-lg"
                      style={{ width: '100%', marginTop: '0.5rem', justifyContent: 'center' }}
                      disabled={submitting}
                    >
                      Send Message
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
