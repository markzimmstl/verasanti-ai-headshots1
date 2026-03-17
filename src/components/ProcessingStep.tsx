import React, { useState, useEffect } from 'react';

const LOADING_PHRASES = [
  "Analyzing facial structure…",
  "Building your visual profile…",
  "Setting up the virtual studio…",
  "Placing you in the scene…",
  "Adjusting lighting and shadow…",
  "Rendering high-resolution detail…",
  "Polishing the final image…",
  "Almost there…",
];

interface ProcessingStepProps {
  message?: string; // Live override from App e.g. "Generating Look #2 (Image 1 of 3)..."
}

export const ProcessingStep: React.FC<ProcessingStepProps> = ({ message }) => {
  const [idx, setIdx]         = useState(0);
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(4);

  // Rotate ambient status text every 2.8s
  useEffect(() => {
    const iv = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx(p => (p + 1) % LOADING_PHRASES.length);
        setVisible(true);
      }, 300);
    }, 2800);
    return () => clearInterval(iv);
  }, []);

  // Creep progress — slows near 92, never reaches 100 until done
  useEffect(() => {
    const iv = setInterval(() => {
      setProgress(p => {
        if (p >= 88) return Math.min(p + 0.2, 92);
        if (p >= 70) return p + 0.7;
        return p + 1.3;
      });
    }, 300);
    return () => clearInterval(iv);
  }, []);

  const pct         = Math.min(progress, 92);
  // message prop = live "Generating Look #1 (Image 2 of 3)…" — shown statically above the rotating phrase
  const rotatingText = LOADING_PHRASES[idx];

  return (
    <div
      className="flex-1 flex items-center justify-center px-8"
      style={{ minHeight: '70vh' }}
    >
      <div className="flex flex-col items-center max-w-md w-full text-center">

        {/* ── Spinner ring ── */}
        <div className="relative mb-10" style={{ width: 96, height: 96 }}>
          <div
            className="absolute rounded-full animate-pulse"
            style={{
              inset: '-16px',
              background: 'radial-gradient(ellipse, rgba(76,29,149,0.35) 0%, transparent 70%)',
            }}
          />
          <svg
            className="absolute inset-0 animate-spin"
            style={{ animationDuration: '1.4s' }}
            width="96" height="96" viewBox="0 0 96 96"
          >
            <defs>
              <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7C3AED" />
                <stop offset="100%" stopColor="#0D9488" />
              </linearGradient>
            </defs>
            <circle cx="48" cy="48" r="44" fill="none" stroke="rgba(76,29,149,0.15)" strokeWidth="3" />
            <circle
              cx="48" cy="48" r="44" fill="none"
              stroke="url(#ringGrad)" strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="138 138"
              strokeDashoffset="104"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-3xl">✦</div>
        </div>

        {/* ── Headline ── */}
        <h1
          className="mb-3 leading-tight"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '36px',
            fontWeight: 400,
            color: '#fff',
            letterSpacing: '-0.02em',
          }}
        >
          Building your<br />
          <em style={{ color: 'rgba(159,103,255,0.9)' }}>brand images</em>
        </h1>

        {/* ── Static generation status (from App) ── */}
        {message && (
          <div
            className="mb-3 px-4 py-2 rounded-full"
            style={{
              background: 'rgba(13,148,136,0.1)',
              border: '1px solid rgba(13,148,136,0.25)',
              fontSize: '13px',
              fontWeight: 500,
              color: 'rgba(13,148,136,0.9)',
              letterSpacing: '0.01em',
            }}
          >
            {message}
          </div>
        )}

        {/* ── Rotating ambient status text ── */}
        <div
          className="flex items-center justify-center gap-2.5 mb-10 overflow-hidden"
          style={{ height: 28 }}
        >
          <p
            className="text-[15px] font-light transition-all duration-300"
            style={{
              color: 'rgba(255,255,255,0.45)',
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(-6px)',
            }}
          >
            {rotatingText}
          </p>
          <div className="flex gap-1 items-center shrink-0">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: 'rgba(124,58,237,0.7)',
                  animation: `dotPulse 1.4s ${i * 0.18}s ease-in-out infinite`,
                }}
              />
            ))}
          </div>
        </div>

        {/* ── Progress bar ── */}
        <div className="w-full mb-3">
          <div
            className="rounded-full overflow-hidden"
            style={{ height: 3, background: 'rgba(255,255,255,0.07)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${pct}%`,
                background: 'linear-gradient(90deg, #2E1065 0%, #7C3AED 45%, #0D9488 100%)',
                backgroundSize: '300% 100%',
                animation: 'shimmer 2.4s linear infinite',
              }}
            />
          </div>
        </div>

        {/* ── Percentage readout ── */}
        <div className="flex items-center justify-between w-full">
          <span
            className="text-[11px] uppercase tracking-wider"
            style={{ color: 'rgba(255,255,255,0.2)' }}
          >
            Generating
          </span>
          <span
            className="text-[11px] font-medium tabular-nums"
            style={{ color: 'rgba(124,58,237,0.7)' }}
          >
            {Math.round(pct)}%
          </span>
        </div>

        {/* ── Reassurance copy ── */}
        <p
          className="text-[15px] leading-relaxed mt-9"
          style={{ color: 'rgba(255,255,255,0.6)', maxWidth: 320 }}
        >
          This takes 30–90 seconds per image.<br />
          Please keep this tab open.
        </p>

      </div>

      <style>{`
        @keyframes dotPulse {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
          40%            { transform: scale(1);   opacity: 1; }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
      `}</style>
    </div>
  );
};
