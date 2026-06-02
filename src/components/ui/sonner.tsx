import { Toaster as Sonner } from "sonner";
import React, { useEffect } from "react";

type ToasterProps = React.ComponentProps<typeof Sonner>;

// Web Audio API Synthesizer for high-fidelity soft UI clicks & feedback
let lastPlayTime = 0;

const playSound = (type: "success" | "error") => {
  try {
    const now = Date.now();
    if (now - lastPlayTime < 300) return; // Prevent sound overlapping spam
    lastPlayTime = now;

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const t = ctx.currentTime;
    const dest = ctx.destination;

    if (type === "success") {
      // 1. Volume setting (0.2 - 0.3) & Lowpass warm filter
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.24, t);
      
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(2000, t);
      
      // 2. Feedback delay loop for space / reverb feel
      const delay = ctx.createDelay();
      delay.delayTime.value = 0.06; // 60ms delay
      const feedback = ctx.createGain();
      feedback.gain.value = 0.25; // 25% feedback
      
      delay.connect(feedback);
      feedback.connect(delay);
      
      filter.connect(masterGain);
      masterGain.connect(dest);
      
      filter.connect(delay);
      delay.connect(masterGain);

      // 3. Pitch variation (0.98 - 1.02)
      const pitchFactor = 0.98 + Math.random() * 0.04;
      // Soft high-end glass success chime frequencies:
      // Note 1: A5 (880 Hz)
      // Note 2: C#6 (1109.73 Hz)
      const freq1 = 880 * pitchFactor;
      const freq2 = 1109.73 * pitchFactor;

      // Tone 1 (Soft glass tap start)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(freq1, t);
      gain1.gain.setValueAtTime(0, t);
      gain1.gain.linearRampToValueAtTime(0.4, t + 0.015);
      gain1.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      osc1.connect(gain1);
      gain1.connect(filter);

      // Tone 2 (Harmonic, delayed slightly for space)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(freq2, t + 0.04);
      gain2.gain.setValueAtTime(0, t + 0.04);
      gain2.gain.linearRampToValueAtTime(0.3, t + 0.055);
      gain2.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      osc2.connect(gain2);
      gain2.connect(filter);

      osc1.start(t);
      osc1.stop(t + 0.25);
      osc2.start(t + 0.04);
      osc2.stop(t + 0.35);
    } else {
      // Premium warm error buzz
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.18, t);
      masterGain.connect(dest);

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1000, t);
      filter.connect(masterGain);

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(260, t);
      osc.frequency.exponentialRampToValueAtTime(160, t + 0.25);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.5, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);

      osc.connect(gain);
      gain.connect(filter);

      osc.start(t);
      osc.stop(t + 0.35);
    }
  } catch (e) {
    console.warn("Audio Context playback failed or blocked:", e);
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

