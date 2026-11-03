import React, { useState } from 'react';
import { Volume2, X, Github, ShieldCheck, Download } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeVersion: 'v1' | 'v2';
  onSelectVersion: (version: 'v1' | 'v2') => void;
  availableVoices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  onSelectVoice: (voice: SpeechSynthesisVoice) => void;
  speechRate: number;
  onSelectRate: (rate: number) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  activeVersion,
  onSelectVersion,
  availableVoices,
  selectedVoice,
  onSelectVoice,
  speechRate,
  onSelectRate,
}) => {
  const [showDeployGuide, setShowDeployGuide] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm select-none p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-t-3xl sm:rounded-2xl p-6 text-white max-h-[85vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-semibold">Voice & Audio Settings</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close settings"
            className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 space-y-6">
          {/* A/B Testing Version Selector */}
          <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-200">Testing Version</span>
              <span className="text-[11px] font-mono text-sky-400 font-semibold uppercase">
                {activeVersion === 'v1' ? 'Version 1 (Baseline)' : 'Version 2 (Intervention)'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onSelectVersion('v1')}
                className={`flex flex-col p-2.5 rounded-lg border text-left transition-all ${
                  activeVersion === 'v1'
                    ? 'border-sky-500 bg-sky-950/30 text-white'
                    : 'border-neutral-800 bg-neutral-900/50 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <span className="text-xs font-bold text-neutral-100">Version 1 (V1)</span>
                <span className="text-[10px] text-neutral-400 mt-0.5">
                  Control baseline with ChatGPT-style fluid canvas orb
                </span>
              </button>
              <button
                type="button"
                onClick={() => onSelectVersion('v2')}
                className={`flex flex-col p-2.5 rounded-lg border text-left transition-all ${
                  activeVersion === 'v2'
                    ? 'border-sky-500 bg-sky-950/30 text-white'
                    : 'border-neutral-800 bg-neutral-900/50 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <span className="text-xs font-bold text-neutral-100">Version 2 (V2)</span>
                <span className="text-[10px] text-neutral-400 mt-0.5">
                  Intervention test with expressive flat minimal animated orb
                </span>
              </button>
            </div>
            <p className="text-[10px] text-neutral-500">
              Direct links for testers: <code className="text-neutral-400">?v=1</code> for V1 or <code className="text-neutral-400">?v=2</code> for V2.
            </p>

            <a
              href="./voice-astrologer-base-v1.zip"
              download="voice-astrologer-base-v1.zip"
              className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 hover:border-neutral-700 text-xs font-medium text-neutral-200 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span>Download Base Safe State (ZIP)</span>
            </a>
          </div>

          {/* Server-Side Gemini API Status */}
          <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Server-Side Gemini API Active</span>
            </div>
            <p className="text-[11px] text-neutral-400 leading-normal">
              Voice interactions are powered server-side by Gemini 3.8 Flash. Your attached API key is configured automatically in the app settings so anyone who opens the link can talk instantly.
            </p>
          </div>

          {/* Device Neural Voice Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-300">
              Speech Synthesizer Voice
            </label>
            <select
              value={selectedVoice?.name || ''}
              onChange={(e) => {
                const voice = availableVoices.find((v) => v.name === e.target.value);
                if (voice) onSelectVoice(voice);
              }}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-sky-500"
            >
              {availableVoices.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name} ({v.lang}) {v.name.includes('Natural') || v.name.includes('Google') ? '★ Neural' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Speech Rate Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-neutral-300">
              <span className="font-semibold">Speech Speed</span>
              <span className="text-sky-400 font-mono">{speechRate.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.8"
              max="1.4"
              step="0.05"
              value={speechRate}
              onChange={(e) => onSelectRate(parseFloat(e.target.value))}
              className="w-full accent-sky-500 cursor-pointer"
            />
          </div>

          {/* GitHub Deployment Note */}
          <div className="pt-2 border-t border-neutral-800">
            <button
              type="button"
              onClick={() => setShowDeployGuide(!showDeployGuide)}
              className="w-full flex items-center justify-between text-xs text-neutral-400 hover:text-neutral-200 py-1 transition-colors"
            >
              <span className="flex items-center gap-1.5 font-medium">
                <Github className="w-4 h-4 text-neutral-300" />
                <span>Deployment & Hosting info</span>
              </span>
              <span className="text-xs text-sky-400 font-semibold">
                {showDeployGuide ? 'Hide' : 'View'}
              </span>
            </button>

            {showDeployGuide && (
              <div className="mt-3 p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-400 space-y-2 leading-relaxed">
                <p className="text-neutral-200 font-medium">
                  Full-stack architecture running Node.js / Express with server-side Gemini 3.8 Flash:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Dev server runs with Vite middleware mounted on Express.</li>
                  <li>Builds with standard <code>npm run build</code>.</li>
                  <li>Production starts with <code>npm start</code> (running <code>node server.ts</code>).</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
