import React, { useEffect, useMemo, useRef, useState } from 'react';
import { OrbState } from './FluidOrb';

export type ExpressiveExpression =
  | 'idle'
  | 'listening'
  | 'nodding'
  | 'thinking'
  | 'speaking'
  | 'happy'
  | 'error';

interface ExpressiveOrbProps {
  state: OrbState | 'error';
  audioLevel: number; // 0.0 to 1.0 from microphone or TTS
  onInterrupt?: () => void;
  className?: string;
}

/* ========================================================================
   Refined Expressive Orb (Version 2.3)
   1. Normal / Idle State:
      - Eyes are strictly CONSTANT in size (width 22px, height 32px, rx 3.5px).
      - Steady, calm, completely constant rectangular shape matching reference image.
      - Natural organic eyelid blinks + interactive mouse gaze tracking.
   2. Listening (User monologue):
      - Triggers when user starts talking!
      - Eyes dynamically grow big and small STRICTLY on vertical lines (scaleY
        stretching and compressing along vertical lines as monologue progresses).
   3. Affirmative Nod:
      - Occurs the instant the user monologue ends ("Yes, understood!").
   4. Processing (Thinking):
      - Blue gradient part rotates in circle continuously (360° spin).
      - Squarish eyes scan left and right analyzing data.
   5. Answering (Speaking):
      - Diverse facial expressions (articulation, nods, inquisitive wonder, joyful smiles).
   6. Mouse Gaze:
      - Eyes track cursor when mouse moves near the orb.
   ======================================================================== */

// Happy / Joyful smiling squarish squint eyes
const HappyEyesGroup: React.FC<{ strokeWidth?: number; className?: string }> = ({
  strokeWidth = 5.5,
  className = '',
}) => (
  <g
    fill="none"
    stroke="#0e1838"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    className={`animate-eye-blink ${className}`}
  >
    {/* Left Smiling Squint Arc (centered at cx=121) */}
    <path
      d="M 109 152 Q 121 138 133 152"
      className="transition-all duration-200 ease-out"
    />
    {/* Right Smiling Squint Arc (centered at cx=179) */}
    <path
      d="M 167 152 Q 179 138 191 152"
      className="transition-all duration-200 ease-out"
    />
  </g>
);

// Common SVG Gradient Definitions matching reference image exactly
const OrbDefs: React.FC = () => (
  <defs>
    {/* Exact Reference Gradient: Soft luminous blue to bottom white glow */}
    <linearGradient id="orbGradReference" x1="25%" y1="0%" x2="75%" y2="100%">
      <stop offset="0%" stopColor="#558ef7" />
      <stop offset="30%" stopColor="#699efa" />
      <stop offset="65%" stopColor="#96beff" />
      <stop offset="88%" stopColor="#d2e3ff" />
      <stop offset="100%" stopColor="#f3f7ff" />
    </linearGradient>

    {/* Warm Coral / Amber Gradient for Error & Timeout States */}
    <linearGradient id="orbGradError" x1="25%" y1="0%" x2="75%" y2="100%">
      <stop offset="0%" stopColor="#f87171" />
      <stop offset="35%" stopColor="#fca5a5" />
      <stop offset="70%" stopColor="#fed7aa" />
      <stop offset="100%" stopColor="#fff7ed" />
    </linearGradient>

    {/* Soft conversational speech aura filter */}
    <filter id="speechGlowRef" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
);

// 1. Normal (Idle / Resting State):
// Constant eye size (width 22px, height 32px, rx 3.5px), steady and calm
const NormalVector: React.FC<{
  mouseGaze: { x: number; y: number };
}> = ({ mouseGaze }) => (
  <svg
    viewBox="0 0 300 300"
    className="w-full h-full select-none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <OrbDefs />
    {/* Reference blue circle */}
    <circle cx="150" cy="150" r="112" fill="url(#orbGradReference)" />

    {/* Mouse tracking eye group */}
    <g
      style={{
        transform: `translate(${mouseGaze.x}px, ${mouseGaze.y}px)`,
        transition: 'transform 0.12s ease-out',
      }}
    >
      {/* STRICTLY CONSTANT squarish eyes in Normal / Idle state with natural eyelid blink */}
      <g fill="#0e1838" className="animate-eye-blink">
        <rect x="110" y="134" width="22" height="32" rx="3.5" />
        <rect x="168" y="134" width="22" height="32" rx="3.5" />
      </g>
    </g>
  </svg>
);

// 2. Listening (User Monologue):
// Triggers when user is talking! Eyes get big and small strictly along VERTICAL lines
const ListeningVector: React.FC<{
  audio: number;
  mouseGaze: { x: number; y: number };
}> = ({ audio, mouseGaze }) => {
  return (
    <svg
      viewBox="0 0 300 300"
      className="w-full h-full select-none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <OrbDefs />
      <circle cx="150" cy="150" r="112" fill="url(#orbGradReference)" />

      {/* Mouse Gaze Tracking Group */}
      <g
        style={{
          transform: `translate(${mouseGaze.x}px, ${mouseGaze.y}px)`,
          transition: 'transform 0.12s ease-out',
        }}
      >
        {/* Concentration Monologue: Eyes scale big and small STRICTLY on vertical lines */}
        <g className="animate-eye-vertical-monologue">
          <g fill="#0e1838" className="animate-eye-blink">
            <rect
              x="110"
              y="134"
              width="22"
              height="32"
              rx="3.5"
            />
            <rect
              x="168"
              y="134"
              width="22"
              height="32"
              rx="3.5"
            />
          </g>
        </g>
      </g>
    </svg>
  );
};

// 3. Nodding:
// Affirmative nod when user finishes their monologue ("Yes, I understood!")
const NoddingVector: React.FC<{ mouseGaze: { x: number; y: number } }> = ({
  mouseGaze,
}) => (
  <svg
    viewBox="0 0 300 300"
    className="w-full h-full select-none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <OrbDefs />
    <circle cx="150" cy="150" r="112" fill="url(#orbGradReference)" />

    <g
      style={{
        transform: `translate(${mouseGaze.x}px, ${mouseGaze.y}px)`,
        transition: 'transform 0.12s ease-out',
      }}
    >
      <g fill="#0e1838" className="animate-eye-blink">
        <rect x="110" y="138" width="22" height="26" rx="3.5" />
        <rect x="168" y="138" width="22" height="26" rx="3.5" />
      </g>
    </g>
  </svg>
);

// 4. Speaking:
// Rich diversity of facial expressions while answering:
// - Articulating vocal cadence
// - Inquisitive curiosity
// - Empathic concentrated focus
// - Affirmative nod
// - Joyful smiling squints
const SpeakingVector: React.FC<{
  audio: number;
  subExpression: 'articulating' | 'nodding' | 'happy' | 'inquisitive' | 'focus';
  mouseGaze: { x: number; y: number };
}> = ({ audio, subExpression, mouseGaze }) => {
  const leftHeight = Math.min(38, Math.max(28, 31 + audio * 5));
  const rightHeight = Math.min(39, Math.max(28, 31 + audio * 6));
  const leftY = 150 - leftHeight / 2;
  const rightY = 150 - rightHeight / 2;

  return (
    <svg
      viewBox="0 0 300 300"
      className="w-full h-full select-none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <OrbDefs />

      {/* Subtle speech aura pulse */}
      <circle
        cx="150"
        cy="150"
        r="112"
        fill="url(#orbGradReference)"
        filter="url(#speechGlowRef)"
        opacity={0.25 + audio * 0.3}
      />

      <circle cx="150" cy="150" r="112" fill="url(#orbGradReference)" />

      {/* Mouse Gaze Tracking Group */}
      <g
        style={{
          transform: `translate(${mouseGaze.x}px, ${mouseGaze.y}px)`,
          transition: 'transform 0.12s ease-out',
        }}
      >
        {subExpression === 'happy' ? (
          <HappyEyesGroup strokeWidth={5.5 + audio * 1.5} />
        ) : subExpression === 'inquisitive' ? (
          /* Inquisitive wonder: wider, slightly lifted eyes */
          <g fill="#0e1838" className="animate-eye-blink">
            <rect x="110" y="129" width="22" height="36" rx="3.5" />
            <rect x="168" y="129" width="22" height="36" rx="3.5" />
          </g>
        ) : subExpression === 'focus' ? (
          /* Focused contemplative squint */
          <g fill="#0e1838" className="animate-eye-blink">
            <rect x="110" y="137" width="22" height="26" rx="3.5" />
            <rect x="168" y="137" width="22" height="26" rx="3.5" />
          </g>
        ) : subExpression === 'nodding' ? (
          <g fill="#0e1838" className="animate-eye-blink">
            <rect x="110" y="138" width="22" height="26" rx="3.5" />
            <rect x="168" y="138" width="22" height="26" rx="3.5" />
          </g>
        ) : (
          /* Articulating Squarish Eyes pulsing to speech syllables */
          <g fill="#0e1838" className="animate-eye-blink">
            <rect
              x="110"
              y={leftY}
              width="22"
              height={leftHeight}
              rx="3.5"
              className="transition-all duration-75 ease-out"
            />
            <rect
              x="168"
              y={rightY}
              width="22"
              height={rightHeight}
              rx="3.5"
              className="transition-all duration-75 ease-out"
            />
          </g>
        )}
      </g>
    </svg>
  );
};

// 5. Processing / Thinking:
// The circle stays completely steady while only the squarish eyes move smoothly from left to right
const ThinkingVector: React.FC = () => (
  <svg
    viewBox="0 0 300 300"
    className="w-full h-full select-none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <OrbDefs />

    {/* Steady circle: completely still without rotation or position displacement */}
    <circle cx="150" cy="150" r="112" fill="url(#orbGradReference)" />

    {/* Only eyes move from left to right to show thinking */}
    <g className="animate-thinking-eyes-horizontal">
      <g fill="#0e1838" className="animate-eye-blink">
        <rect
          x="110"
          y="134"
          width="22"
          height="32"
          rx="3.5"
        />
        <rect
          x="168"
          y="134"
          width="22"
          height="32"
          rx="3.5"
        />
      </g>
    </g>
  </svg>
);

// 6. Error:
// Apologetic / distressed squarish eyes with warm peach-coral tone (offline or timeout)
const ErrorVector: React.FC = () => (
  <svg
    viewBox="0 0 300 300"
    className="w-full h-full select-none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <OrbDefs />
    <circle cx="150" cy="150" r="112" fill="url(#orbGradError)" />

    {/* Distressed tilted squarish eyes */}
    <g fill="#0e1838" className="animate-eye-blink">
      <rect
        x="110"
        y="135"
        width="22"
        height="30"
        rx="3.5"
        transform="rotate(12 121 150)"
      />
      <rect
        x="168"
        y="135"
        width="22"
        height="30"
        rx="3.5"
        transform="rotate(-12 179 150)"
      />
    </g>
  </svg>
);

export const ExpressiveOrb: React.FC<ExpressiveOrbProps> = ({
  state,
  audioLevel,
  onInterrupt,
  className = '',
}) => {
  const orbRef = useRef<HTMLDivElement>(null);
  const [isTapped, setIsTapped] = useState<boolean>(false);

  // Mouse reaction: Eyes follow mouse pointer when nearby
  const [mouseGaze, setMouseGaze] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Speaking expression diversity states:
  // articulating -> inquisitive -> focus -> nodding -> happy
  const [speakingSubExpression, setSpeakingSubExpression] = useState<
    'articulating' | 'nodding' | 'happy' | 'inquisitive' | 'focus'
  >('articulating');

  // Mouse proximity tracking: eyes look towards cursor when near
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Don't override thinking scan
      if (state === 'thinking') {
        setMouseGaze({ x: 0, y: 0 });
        return;
      }

      if (!orbRef.current) return;
      const rect = orbRef.current.getBoundingClientRect();
      const orbCenterX = rect.left + rect.width / 2;
      const orbCenterY = rect.top + rect.height / 2;

      const dx = e.clientX - orbCenterX;
      const dy = e.clientY - orbCenterY;
      const distance = Math.hypot(dx, dy);

      // React to mouse if near the orb (within 550px radius)
      if (distance < 550) {
        const maxOffset = 11;
        const normalizedDist = Math.max(distance, 35);
        const factor = Math.min(1.1, Math.max(0.2, (450 - distance) / 380));
        const gazeX = Math.max(-12, Math.min(12, (dx / normalizedDist) * maxOffset * factor));
        const gazeY = Math.max(-8, Math.min(8, (dy / normalizedDist) * maxOffset * factor));
        setMouseGaze({ x: gazeX, y: gazeY });
      } else {
        setMouseGaze({ x: 0, y: 0 });
      }
    };

    const handleMouseLeave = () => {
      setMouseGaze({ x: 0, y: 0 });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [state]);

  // Speaking state expression choreography:
  // Cycles organically through lively articulation, curious wonder, thoughtful focus,
  // understanding nods, and joyful smiles
  useEffect(() => {
    if (state !== 'speaking') {
      setSpeakingSubExpression('articulating');
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) % 11000;
      if (elapsed > 2200 && elapsed < 3500) {
        setSpeakingSubExpression('inquisitive');
      } else if (elapsed >= 3500 && elapsed < 4800) {
        setSpeakingSubExpression('nodding');
      } else if (elapsed >= 4800 && elapsed < 6500) {
        setSpeakingSubExpression('focus');
      } else if (elapsed >= 7500 && elapsed < 9000) {
        setSpeakingSubExpression('happy');
      } else {
        setSpeakingSubExpression('articulating');
      }
    }, 120);

    return () => clearInterval(interval);
  }, [state]);

  const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setIsTapped(true);
    setTimeout(() => setIsTapped(false), 200);
    if (onInterrupt) {
      onInterrupt();
    }
  };

  const clampedAudio = useMemo(() => {
    return Math.min(Math.max(audioLevel || 0, 0), 1);
  }, [audioLevel]);

  // Gestural animation class
  const gestureClass = useMemo(() => {
    if (state === 'error') return 'animate-orb-jitter';
    if (state === 'thinking') return ''; // Keep circle position completely steady in thinking state
    if (state === 'listening') return 'animate-orb-listening';
    if (state === 'nodding') return 'animate-orb-nod';
    if (state === 'speaking') {
      if (speakingSubExpression === 'nodding') return 'animate-orb-nod';
      if (speakingSubExpression === 'happy') return 'animate-happy-eyes';
      return 'animate-orb-speaking';
    }
    return 'animate-orb-breathe';
  }, [state, speakingSubExpression]);

  // Reactive scale
  const reactiveScale = useMemo(() => {
    if (isTapped) return 0.95;
    if (state === 'listening') {
      return 1 + clampedAudio * 0.04;
    }
    if (state === 'speaking') {
      return 1 + clampedAudio * 0.03;
    }
    return 1;
  }, [isTapped, state, clampedAudio]);

  return (
    <div
      ref={orbRef}
      className={`flex flex-col items-center justify-center relative select-none ${className}`}
    >
      {/* Reduced size by 1/3rd: w-44 h-44 sm:w-48 sm:h-48 (176px - 192px) */}
      <div
        onClick={handleTap}
        role="button"
        tabIndex={0}
        aria-label={`Expressive Orb: ${state}. Tap to speak or interrupt.`}
        className={`relative w-44 h-44 sm:w-48 sm:h-48 cursor-pointer focus:outline-none transition-transform duration-200 ease-out active:scale-95 ${gestureClass}`}
        style={{
          transform: `scale(${reactiveScale})`,
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          {state === 'idle' && <NormalVector mouseGaze={mouseGaze} />}
          {state === 'listening' && (
            <ListeningVector audio={clampedAudio} mouseGaze={mouseGaze} />
          )}
          {state === 'nodding' && <NoddingVector mouseGaze={mouseGaze} />}
          {state === 'speaking' && (
            <SpeakingVector
              audio={clampedAudio}
              subExpression={speakingSubExpression}
              mouseGaze={mouseGaze}
            />
          )}
          {state === 'thinking' && <ThinkingVector />}
          {state === 'error' && <ErrorVector />}
        </div>
      </div>
    </div>
  );
};
