import { Toaster as Sonner } from "sonner";
import React, { useEffect } from "react";

type ToasterProps = React.ComponentProps<typeof Sonner>;

// ── Premium Glass-Tap Sound System ──
// Single shared AudioContext + debounce prevents overlap
let _audioCtx: AudioContext | null = null;
let _lastPlay = 0;

const getCtx = (): AudioContext | null => {
  try {
    const Ctor = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctor) return null;
    if (!_audioCtx) _audioCtx = new Ctor();
    if (_audioCtx.state === "suspended") _audioCtx.resume();
    return _audioCtx;
  } catch {
    return null;
  }
};

const playSound = (type: "success" | "error") => {
  const now = Date.now();
  if (now - _lastPlay < 350) return; // hard debounce — no overlap
  _lastPlay = now;

  const ctx = getCtx();
  if (!ctx) return;

  const t = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0, t);
  master.connect(ctx.destination);

  if (type === "success") {
    // Soft glass-tap chime: two sine partials + subtle room reverb tail
    master.gain.setValueAtTime(0.14, t);

    const hi = ctx.createBiquadFilter();
    hi.type = "highshelf";
    hi.frequency.value = 3500;
    hi.gain.value = -4; // tame harshness
    hi.connect(master);

    const pitchVar = 0.985 + Math.random() * 0.03;

    // Partial 1 — fundamental glass tap (C6 ≈ 1046 Hz)
    const o1 = ctx.createOscillator();
    const g1 = ctx.createGain();
    o1.type = "sine";
    o1.frequency.setValueAtTime(1046 * pitchVar, t);
    g1.gain.setValueAtTime(0, t);
    g1.gain.linearRampToValueAtTime(0.55, t + 0.010); // sharp attack
    g1.gain.exponentialRampToValueAtTime(0.0001, t + 0.18); // quick glass decay
    o1.connect(g1); g1.connect(hi);

    // Partial 2 — upper harmonic (E6 ≈ 1318 Hz), delayed for chime sparkle
    const o2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    o2.type = "sine";
    o2.frequency.setValueAtTime(1318 * pitchVar, t + 0.032);
    g2.gain.setValueAtTime(0, t + 0.032);
    g2.gain.linearRampToValueAtTime(0.32, t + 0.044);
    g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.26);
    o2.connect(g2); g2.connect(hi);

    // Subtle reverb tail via short comb delay
    const delay = ctx.createDelay(0.5);
    delay.delayTime.value = 0.055;
    const fbGain = ctx.createGain();
    fbGain.gain.value = 0.18;
    g1.connect(delay); delay.connect(fbGain); fbGain.connect(delay); delay.connect(master);

    o1.start(t);       o1.stop(t + 0.22);
    o2.start(t + 0.032); o2.stop(t + 0.30);

  } else {
    // Warm soft error: descending triangle tone, very low volume
    master.gain.setValueAtTime(0.10, t);

    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(900, t);
    lp.connect(master);

    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "triangle";
    o.frequency.setValueAtTime(320, t);
    o.frequency.exponentialRampToValueAtTime(190, t + 0.22);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.6, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
    o.connect(g); g.connect(lp);
    o.start(t); o.stop(t + 0.32);
  }
};

const SuccessIcon = () => {
  useEffect(() => {
    // Play sound exactly when the check icon finishes scaling animation (350ms)
    const timer = setTimeout(() => {
      playSound("success");
    }, 350);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative flex items-center justify-center select-none">
      {/* Ripple micro interaction */}
      <span className="absolute inset-0 rounded-full bg-[#00e5ff]/25 icon-ripple-effect pointer-events-none" />

      {/* Particle Burst behind the success icon on entry (6-8 tiny glowing dots) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[...Array(8)].map((_, i) => {
          const angle = (i * 360) / 8;
          const rad = (angle * Math.PI) / 180;
          const x = Math.cos(rad) * 24; // Expand outward 24px
          const y = Math.sin(rad) * 24;
          return (
            <span
              key={i}
              className="absolute w-[3px] h-[3px] rounded-full bg-cyan-300 success-particle"
              style={{
                "--tx": `${x}px`,
                "--ty": `${y}px`,
              } as React.CSSProperties}
            />
          );
        })}
      </div>

      <svg
        width="38"
        height="38"
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="premium-success-icon z-10"
      >
        {/* Animated thick white checkmark */}
        <path
          d="M12 18.5L16 22.5L24 13.5"
          stroke="#ffffff"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="24"
          strokeDashoffset="24"
          className="checkmark-path"
        />
      </svg>
    </div>
  );
};

const ErrorIcon = () => {
  useEffect(() => {
    playSound("error");
  }, []);

  return (
    <div className="relative flex items-center justify-center select-none">
      {/* Ripple micro interaction */}
      <span className="absolute inset-0 rounded-full bg-[#ff4b4b]/20 icon-ripple-effect pointer-events-none" />

      <svg
        width="38"
        height="38"
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="premium-error-icon z-10"
      >
        <defs>
          <linearGradient id="errorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff4b4b" />
            <stop offset="100%" stopColor="#ff7b00" />
          </linearGradient>
          <filter id="errorGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        <circle
          cx="18"
          cy="18"
          r="15"
          stroke="url(#errorGradient)"
          strokeWidth="2.5"
          fill="rgba(24, 10, 10, 0.9)"
          filter="url(#errorGlow)"
        />
        <path
          d="M13 13L23 23M23 13L13 23"
          stroke="url(#errorGradient)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="24"
          strokeDashoffset="24"
          className="error-path"
        />
      </svg>
    </div>
  );
};

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast premium-toast group-[.toaster]:bg-transparent group-[.toaster]:border-0 group-[.toaster]:shadow-none",
          description: "group-[.toast]:text-white/60 text-xs font-medium font-body",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      icons={{
        success: <SuccessIcon />,
        error: <ErrorIcon />,
      }}
      {...props}
    />
  );
};

export { Toaster };

