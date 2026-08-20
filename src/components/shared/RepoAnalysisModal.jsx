import React, { useState, useEffect, useRef } from 'react'
import {
  GitPullRequestIcon,
  ZapIcon,
  LayersIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  RepoIcon,
  ClockIcon,
  ShieldBlockIcon
} from './Icons'

const ANALYSIS_STAGES = [
  {
    id: 'verify',
    title: 'Validating GitHub Access & Permissions',
    desc: 'Connecting to GitHub API, checking repository access and default branch HEAD',
    icon: RepoIcon,
    color: '#60a5fa'
  },
  {
    id: 'ingest',
    title: 'Ingesting Pull Requests & Diffs',
    desc: 'Streaming open pull requests, commit metadata, changed files and author telemetry',
    icon: GitPullRequestIcon,
    color: '#38bdf8'
  },
  {
    id: 'triage',
    title: 'Executing AI Priority & Risk Triage',
    desc: 'Computing risk scores, blast radius, complexity vectors and merge conflict likelihood',
    icon: ZapIcon,
    color: '#a855f7'
  },
  {
    id: 'graph',
    title: 'Constructing Dependency & Reviewer Graph',
    desc: 'Mapping cross-PR blocker chains, reviewer workload distribution and turnaround metrics',
    icon: LayersIcon,
    color: '#34d399'
  },
  {
    id: 'finalize',
    title: 'Finalizing Live Telemetry Stream',
    desc: 'Binding webhook triggers and compiling codebase intelligence dashboard',
    icon: ShieldBlockIcon,
    color: '#22d3ee'
  }
]

export default function RepoAnalysisModal({
  isOpen,
  repoSlug,
  status = 'analyzing', // 'analyzing' | 'success' | 'error'
  errorMessage = '',
  currentStage = 0,
  progress = 15,
  logs = [],
  onClose,
  onRetry
}) {
  const terminalEndRef = useRef(null)

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs])

  if (!isOpen) return null

  const isComplete = status === 'success'
  const isError = status === 'error'

  return (
    <div
      className="modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(2, 4, 7, 0.88)',
        backdropFilter: 'blur(16px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
        animation: 'fadeIn 0.25s ease-out'
      }}
      onClick={isComplete || isError ? onClose : undefined}
    >
      <div
        className="glass-strong"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '92vh',
          backgroundColor: 'rgba(6, 12, 26, 0.98)',
          border: isError
            ? '1px solid rgba(248, 113, 113, 0.4)'
            : isComplete
            ? '1px solid rgba(52, 211, 153, 0.4)'
            : '1px solid rgba(34, 211, 238, 0.35)',
          boxShadow: isError
            ? '0 24px 80px rgba(0, 0, 0, 0.85), 0 0 50px rgba(248, 113, 113, 0.2)'
            : isComplete
            ? '0 24px 80px rgba(0, 0, 0, 0.85), 0 0 50px rgba(52, 211, 153, 0.2)'
            : '0 24px 80px rgba(0, 0, 0, 0.85), 0 0 50px rgba(34, 211, 238, 0.18)',
          borderRadius: 22,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top accent glow line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: isError
              ? 'linear-gradient(90deg, #f87171, #fbbf24)'
              : isComplete
              ? 'linear-gradient(90deg, #34d399, #22d3ee)'
              : 'linear-gradient(90deg, #3b82f6, #06b6d4, #34d399, #a855f7)',
            backgroundSize: '200% 100%',
            animation: isError ? 'none' : 'shimmerGradient 3s linear infinite'
          }}
        />

        {/* Modal Header */}
        <div
          style={{
            padding: '1.75rem 2rem 1.25rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Animated Cybernetic Orbital Icon */}
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                background: isError
                  ? 'rgba(248, 113, 113, 0.15)'
                  : isComplete
                  ? 'rgba(52, 211, 153, 0.15)'
                  : 'rgba(34, 211, 238, 0.12)',
                border: isError
                  ? '1px solid rgba(248, 113, 113, 0.4)'
                  : isComplete
                  ? '1px solid rgba(52, 211, 153, 0.4)'
                  : '1px solid rgba(34, 211, 238, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                flexShrink: 0
              }}
            >
              {!isComplete && !isError && (
                <div
                  style={{
                    position: 'absolute',
                    inset: -3,
                    borderRadius: 18,
                    border: '2px dashed rgba(34, 211, 238, 0.6)',
                    animation: 'spinRing 8s linear infinite'
                  }}
                />
              )}

              {isError ? (
                <AlertTriangleIcon size={26} color="#f87171" />
              ) : isComplete ? (
                <CheckCircleIcon size={26} color="#34d399" />
              ) : (
                <ZapIcon size={26} color="var(--cyan-400)" />
              )}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <h3
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: '#fff',
                    margin: 0,
                    letterSpacing: '-0.01em'
                  }}
                >
                  {isError
                    ? 'Connection & Analysis Failed'
                    : isComplete
                    ? 'Codebase Analysis Complete!'
                    : 'Analyzing Codebase Telemetry'}
                </h3>

                <span
                  style={{
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-mono)',
                    padding: '0.2rem 0.6rem',
                    borderRadius: 6,
                    background: isError
                      ? 'rgba(248,113,113,0.15)'
                      : isComplete
                      ? 'rgba(52,211,153,0.15)'
                      : 'rgba(34,211,238,0.15)',
                    color: isError ? '#f87171' : isComplete ? '#34d399' : 'var(--cyan-400)',
                    border: `1px solid ${
                      isError
                        ? 'rgba(248,113,113,0.3)'
                        : isComplete
                        ? 'rgba(52,211,153,0.3)'
                        : 'rgba(34,211,238,0.3)'
                    }`,
                    fontWeight: 600
                  }}
                >
                  {repoSlug || 'github-repository'}
                </span>
              </div>

              <p
                style={{
                  fontSize: '0.8125rem',
                  color: 'rgba(255, 255, 255, 0.55)',
                  margin: '0.25rem 0 0 0'
                }}
              >
                {isError
                  ? 'We encountered an issue during repository verification.'
                  : isComplete
                  ? 'AI triage scores, PR dependency mapping, and telemetry ready.'
                  : 'PRFlow automated intelligence engine is scanning repository data.'}
              </p>
            </div>
          </div>

          {(isComplete || isError) && (
            <button
              onClick={onClose}
              className="btn btn-ghost"
              style={{
                borderRadius: 8,
                padding: '0.4rem 0.6rem',
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '1.25rem',
                lineHeight: 1
              }}
            >
              ×
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.75rem 2rem', overflowY: 'auto', flex: 1 }}>
          {/* Progress Bar & Readout */}
          <div style={{ marginBottom: '1.75rem' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.6rem'
              }}
            >
              <span
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: isError ? '#f87171' : isComplete ? '#34d399' : '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem'
                }}
              >
                {!isComplete && !isError && (
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: 'var(--cyan-400)',
                      boxShadow: '0 0 10px var(--cyan-400)',
                      display: 'inline-block',
                      animation: 'pulseGlow 1.5s ease-in-out infinite'
                    }}
                  />
                )}
                {isError
                  ? 'Analysis Interrupted'
                  : isComplete
                  ? 'All Telemetry Pipelines Synchronized'
                  : ANALYSIS_STAGES[currentStage]?.title || 'Analyzing Repository...'}
              </span>

              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: isError ? '#f87171' : isComplete ? '#34d399' : 'var(--cyan-400)'
                }}
              >
                {Math.min(100, Math.max(0, Math.round(progress)))}%
              </span>
            </div>

            {/* Track */}
            <div
              style={{
                height: 8,
                borderRadius: 999,
                background: 'rgba(255, 255, 255, 0.08)',
                overflow: 'hidden',
                position: 'relative'
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, Math.max(0, progress))}%`,
                  borderRadius: 999,
                  background: isError
                    ? '#f87171'
                    : isComplete
                    ? 'linear-gradient(90deg, #34d399, #22d3ee)'
                    : 'linear-gradient(90deg, #3b82f6 0%, #06b6d4 50%, #34d399 100%)',
                  transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: isError
                    ? '0 0 12px rgba(248,113,113,0.5)'
                    : '0 0 15px rgba(34,211,238,0.5)',
                  position: 'relative'
                }}
              >
                {!isComplete && !isError && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background:
                        'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                      animation: 'shimmerSweep 1.6s infinite'
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Error Message Box */}
          {isError && (
            <div
              style={{
                background: 'rgba(248, 113, 113, 0.1)',
                border: '1px solid rgba(248, 113, 113, 0.3)',
                borderRadius: 12,
                padding: '1.25rem',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.85rem'
              }}
            >
              <AlertTriangleIcon size={20} color="#f87171" style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1 }}>
                <div style={{ color: '#f87171', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                  Connection Error
                </div>
                <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.8125rem', lineHeight: 1.5 }}>
                  {errorMessage || 'Unable to connect to the specified GitHub repository. Please verify the repository slug and permissions.'}
                </div>
              </div>
            </div>
          )}

          {/* Stage Milestones List */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              marginBottom: '1.5rem'
            }}
          >
            {ANALYSIS_STAGES.map((stageItem, idx) => {
              const isPast = currentStage > idx || isComplete
              const isCurrent = currentStage === idx && !isComplete && !isError
              const isPending = currentStage < idx && !isComplete
              const StageIcon = stageItem.icon

              return (
                <div
                  key={stageItem.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.85rem',
                    padding: '0.75rem 1rem',
                    borderRadius: 12,
                    background: isCurrent
                      ? 'rgba(34, 211, 238, 0.08)'
                      : isPast
                      ? 'rgba(52, 211, 153, 0.04)'
                      : 'rgba(255, 255, 255, 0.02)',
                    border: isCurrent
                      ? '1px solid rgba(34, 211, 238, 0.3)'
                      : isPast
                      ? '1px solid rgba(52, 211, 153, 0.2)'
                      : '1px solid rgba(255, 255, 255, 0.04)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {/* Status Indicator Circle */}
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: isPast
                        ? 'rgba(52, 211, 153, 0.2)'
                        : isCurrent
                        ? 'rgba(34, 211, 238, 0.2)'
                        : 'rgba(255, 255, 255, 0.05)',
                      border: isPast
                        ? '1px solid #34d399'
                        : isCurrent
                        ? '1px solid var(--cyan-400)'
                        : '1px solid rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: 2
                    }}
                  >
                    {isPast ? (
                      <CheckCircleIcon size={16} color="#34d399" />
                    ) : isCurrent ? (
                      <div
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          background: 'var(--cyan-400)',
                          animation: 'pulseGlow 1.2s ease-in-out infinite'
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)' }}>
                        {idx + 1}
                      </span>
                    )}
                  </div>

                  {/* Stage Text */}
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: isPast ? '#fff' : isCurrent ? 'var(--cyan-300)' : 'rgba(255,255,255,0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <StageIcon size={14} color={isPast ? '#34d399' : isCurrent ? 'var(--cyan-400)' : 'rgba(255,255,255,0.3)'} />
                        <span>{stageItem.title}</span>
                      </div>

                      {isCurrent && (
                        <span
                          style={{
                            fontSize: '0.6875rem',
                            color: 'var(--cyan-400)',
                            fontFamily: 'var(--font-mono)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}
                        >
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              background: 'var(--cyan-400)',
                              display: 'inline-block',
                              animation: 'pulseGlow 1s infinite'
                            }}
                          />
                          RUNNING
                        </span>
                      )}

                      {isPast && (
                        <span style={{ fontSize: '0.6875rem', color: '#34d399', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                          DONE
                        </span>
                      )}
                    </div>

                    <p
                      style={{
                        fontSize: '0.75rem',
                        color: isPast
                          ? 'rgba(255,255,255,0.5)'
                          : isCurrent
                          ? 'rgba(255,255,255,0.7)'
                          : 'rgba(255,255,255,0.3)',
                        margin: '0.2rem 0 0 0',
                        lineHeight: 1.4
                      }}
                    >
                      {stageItem.desc}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Live Telemetry Terminal Feed */}
          <div
            style={{
              background: 'rgba(3, 6, 15, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 12,
              padding: '0.85rem 1rem',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.75)',
              maxHeight: '130px',
              overflowY: 'auto'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                paddingBottom: '0.4rem',
                marginBottom: '0.5rem',
                fontSize: '0.6875rem',
                color: 'rgba(255, 255, 255, 0.4)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f87171' }} />
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fbbf24' }} />
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399' }} />
                <span style={{ marginLeft: 4 }}>TELEMETRY STREAM</span>
              </div>
              <span>PRFlow Engine v3.2</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              {logs.map((logLine, idx) => (
                <div key={idx} style={{ lineHeight: 1.4, display: 'flex', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--cyan-400)', userSelect: 'none' }}>›</span>
                  <span style={{ color: logLine.includes('Error') || logLine.includes('failed') ? '#f87171' : logLine.includes('Complete') || logLine.includes('Success') ? '#34d399' : 'rgba(255, 255, 255, 0.75)' }}>
                    {logLine}
                  </span>
                </div>
              ))}
              {!isComplete && !isError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--cyan-400)' }}>
                  <span>›</span>
                  <span style={{ animation: 'blinkCursor 0.9s infinite' }}>_</span>
                </div>
              )}
              <div ref={terminalEndRef} />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '1.25rem 2rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(3, 7, 16, 0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem'
          }}
        >
          <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.4)' }}>
            {!isComplete && !isError
              ? 'Deep analysis takes ~10-25s for large repos with rich PR history.'
              : isComplete
              ? 'Repository is now active with live PRFlow triage.'
              : 'Check repository name or GitHub permissions.'}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {isError && onRetry && (
              <button onClick={onRetry} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}>
                Retry Analysis
              </button>
            )}

            {isError && (
              <button onClick={onClose} className="btn btn-ghost" style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}>
                Close
              </button>
            )}

            {isComplete && (
              <button
                onClick={onClose}
                className="btn btn-primary"
                style={{
                  padding: '0.5rem 1.25rem',
                  fontSize: '0.8125rem',
                  background: 'linear-gradient(135deg, #06b6d4 0%, #34d399 100%)',
                  borderColor: '#34d399',
                  color: '#000',
                  fontWeight: 700
                }}
              >
                Inspect Repository Telemetry →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
