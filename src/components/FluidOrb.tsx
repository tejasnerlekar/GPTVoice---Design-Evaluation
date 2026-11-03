import React, { useEffect, useRef } from 'react';

export type OrbState = 'idle' | 'listening' | 'nodding' | 'thinking' | 'speaking';

interface FluidOrbProps {
  state: OrbState;
  audioLevel: number; // 0.0 to 1.0 from microphone or TTS
  onInterrupt?: () => void;
  className?: string;
}

export const FluidOrb: React.FC<FluidOrbProps> = ({
  state,
  audioLevel,
  onInterrupt,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const phaseRef = useRef<number>(0);
  const smoothedAudioRef = useRef<number>(0);
  const tapFeedbackRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    // Handle high-DPI displays
    const dpr = window.devicePixelRatio || 1;
    const width = 160;
    const height = 160;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const render = () => {
      if (!isRunning) return;

      // Smooth audio level
      smoothedAudioRef.current += (audioLevel - smoothedAudioRef.current) * 0.2;
      const audio = smoothedAudioRef.current;

      // Handle tap feedback decay
      if (tapFeedbackRef.current > 0) {
        tapFeedbackRef.current *= 0.92;
        if (tapFeedbackRef.current < 0.01) tapFeedbackRef.current = 0;
      }

      // Advance phase according to state
      let speed = 0.025;
      if (state === 'listening') speed = 0.035 + audio * 0.05;
      else if (state === 'thinking') speed = 0.05;
      else if (state === 'speaking') speed = 0.04 + audio * 0.04;

      phaseRef.current += speed;
      const t = phaseRef.current;

      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      const baseRadius = 60 + tapFeedbackRef.current * 8; // ~120px diameter

      // Clip to circular orb boundary
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
      ctx.clip();

      // Deep pitch black inside background
      ctx.fillStyle = '#050713';
      ctx.fillRect(0, 0, width, height);

      // Draw bottom deep royal blue base
      const blueGrad = ctx.createLinearGradient(0, height, 0, 0);
      blueGrad.addColorStop(0, '#1d4ed8'); // royal blue
      blueGrad.addColorStop(0.5, '#2563eb'); // rich blue
      blueGrad.addColorStop(1, '#1e3a8a'); // dark navy
      ctx.fillStyle = blueGrad;
      ctx.fillRect(0, 0, width, height);

      // Draw organic fluid wave layers (bottom blue to top pearlescent white)
      const numWaves = 3;
      for (let w = 0; w < numWaves; w++) {
        ctx.save();
        ctx.beginPath();

        const waveOffset = w * 1.6;
        const waveAmp = (state === 'listening' ? 12 + audio * 22 : state === 'speaking' ? 14 + audio * 18 : 8);

        // Fluid undulating boundary
        ctx.moveTo(0, 0);
        ctx.lineTo(width, 0);

        for (let x = width; x >= 0; x -= 4) {
          const normX = x / width;
          const sine1 = Math.sin(normX * 3.5 + t + waveOffset) * waveAmp;
          const sine2 = Math.cos(normX * 6.0 - t * 0.8 + waveOffset) * (waveAmp * 0.4);
          const y = centerY - 12 + (w * 10) + sine1 + sine2;
          ctx.lineTo(x, y);
        }

        ctx.closePath();

        // Top pearlescent white & misty sky blue gradient
        const pearlGrad = ctx.createLinearGradient(0, 0, width, height);
        pearlGrad.addColorStop(0, 'rgba(255, 255, 255, 0.98)');
        pearlGrad.addColorStop(0.35, 'rgba(224, 242, 254, 0.85)');
        pearlGrad.addColorStop(0.7, 'rgba(147, 197, 253, 0.4)');
        pearlGrad.addColorStop(1, 'rgba(59, 130, 246, 0.05)');

        ctx.fillStyle = pearlGrad;
        ctx.fill();
        ctx.restore();
      }

      // Thinking state orbital luminous swirl
      if (state === 'thinking') {
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(t * 1.5);
        const swirlGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, baseRadius);
        swirlGrad.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
        swirlGrad.addColorStop(0.5, 'rgba(96, 165, 250, 0.3)');
        swirlGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = swirlGrad;
        ctx.fillRect(-baseRadius, -baseRadius, baseRadius * 2, baseRadius * 2);
        ctx.restore();
      }

      // Top-right soft pearlescent glow highlight
      const highlight = ctx.createRadialGradient(
        centerX + 24,
        centerY - 24,
        0,
        centerX + 24,
        centerY - 24,
        baseRadius * 0.85
      );
      highlight.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
      highlight.addColorStop(0.4, 'rgba(255, 255, 255, 0.15)');
      highlight.addColorStop(1, 'transparent');
      ctx.fillStyle = highlight;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
      ctx.fill();

      // Subtle atmospheric edge rim
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius - 0.5, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();

      // Outer soft aura glow when speaking or listening
      if (audio > 0.05 || state === 'speaking') {
        const auraAlpha = Math.min(0.35, audio * 0.4);
        const auraGrad = ctx.createRadialGradient(
          centerX,
          centerY,
          baseRadius,
          centerX,
          centerY,
          baseRadius + 18
        );
        auraGrad.addColorStop(0, `rgba(59, 130, 246, ${auraAlpha})`);
        auraGrad.addColorStop(1, 'rgba(59, 130, 246, 0)');
        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius + 18, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [state, audioLevel]);

  const handleTap = () => {
    tapFeedbackRef.current = 1.0;
    if (onInterrupt) {
      onInterrupt();
    }
  };

  return (
    <div
      onClick={handleTap}
      role="button"
      tabIndex={0}
      aria-label="ChatGPT Voice Orb. Tap to interrupt."
      className={`relative flex items-center justify-center cursor-pointer select-none transition-transform active:scale-95 touch-manipulation ${className}`}
      style={{ width: '150px', height: '150px' }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: '150px', height: '150px' }}
        className="rounded-full shadow-2xl shadow-blue-900/40"
      />
    </div>
  );
};
