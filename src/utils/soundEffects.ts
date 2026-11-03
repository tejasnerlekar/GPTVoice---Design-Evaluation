/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Notification-grade audio feedback synthesizer using Web Audio API.
// Creates clear, pleasant chime/bell notification sounds with zero external audio assets.

let sharedAudioCtx: AudioContext | null = null;

export function setSharedAudioContext(ctx: AudioContext): void {
  if (ctx) {
    sharedAudioCtx = ctx;
  }
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return null;

  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    sharedAudioCtx = new AudioCtx();
  }

  return sharedAudioCtx;
}

// User-interaction unlocker to comply with modern browser autoplay policies
if (typeof window !== 'undefined') {
  const unlock = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  };
  window.addEventListener('click', unlock, { passive: true, once: false });
  window.addEventListener('touchstart', unlock, { passive: true, once: false });
  window.addEventListener('keydown', unlock, { passive: true, once: false });
}

export type PingType =
  | 'finished_listening' // User finished speaking, AI accepted input (crisp ascending chime)
  | 'start_answering'    // AI starts talking (bright prompt chime)
  | 'end_answering'      // AI finishes talking (soft resolving chime)
  | 'error';             // Error alert (subtle double descending tone)

function renderTone(
  ctx: AudioContext,
  freq: number,
  startTime: number,
  duration: number,
  gainLevel: number,
  type: OscillatorType = 'sine'
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);

  // Smooth attack & musical bell decay
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.linearRampToValueAtTime(gainLevel, startTime + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + duration + 0.02);
}

function executePing(ctx: AudioContext, type: PingType): void {
  const now = ctx.currentTime;

  if (type === 'finished_listening') {
    // Two-tone ascending notification chime (D5 587Hz -> A5 880Hz)
    // Clear, musical "ding-ding" acknowledging user finished speaking
    renderTone(ctx, 587.33, now, 0.12, 0.22, 'sine');
    renderTone(ctx, 880.0, now + 0.08, 0.18, 0.24, 'sine');
  } else if (type === 'start_answering') {
    // Soft, welcoming prompt chime (C5 523Hz + E5 659Hz)
    renderTone(ctx, 523.25, now, 0.14, 0.18, 'sine');
    renderTone(ctx, 659.25, now + 0.04, 0.16, 0.16, 'sine');
  } else if (type === 'end_answering') {
    // Soft completion resolution chime (G5 784Hz -> C5 523Hz)
    renderTone(ctx, 783.99, now, 0.12, 0.16, 'sine');
    renderTone(ctx, 523.25, now + 0.07, 0.16, 0.15, 'sine');
  } else if (type === 'error') {
    // Distinct double descending notification alert (F4 349Hz -> C4 261Hz)
    renderTone(ctx, 349.23, now, 0.12, 0.22, 'triangle');
    renderTone(ctx, 261.63, now + 0.11, 0.16, 0.20, 'triangle');
  }
}

export function playPing(type: PingType): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().then(() => {
        executePing(ctx, type);
      }).catch(() => {});
      return;
    }

    executePing(ctx, type);
  } catch {
    // Non-blocking
  }
}
