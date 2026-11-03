import React from 'react';
import { Menu, SlidersHorizontal, Sparkles } from 'lucide-react';

interface TopHeaderProps {
  isVoiceMode: boolean;
  isListening: boolean;
  hasMicPermission: boolean | null;
  activeVersion: 'v1' | 'v2';
  onVersionChange: (version: 'v1' | 'v2') => void;
  onToggleTranscript: () => void;
  onOpenSettings: () => void;
  onOpenPermissionModal: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  isVoiceMode,
  isListening,
  hasMicPermission,
  activeVersion,
  onVersionChange,
  onToggleTranscript,
  onOpenSettings,
  onOpenPermissionModal,
}) => {
  return (
    <header className="relative z-30 flex items-center justify-between w-full px-5 pt-3 pb-2 select-none">
      {/* Left: Hamburger menu pill button */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleTranscript}
          aria-label="Menu"
          className="flex items-center justify-center w-11 h-11 text-neutral-200 bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800/80 rounded-full transition-colors active:scale-95"
        >
          <Menu className="w-5 h-5 text-neutral-300" strokeWidth={2.2} />
        </button>

        {/* Minimal Version A/B Toggle */}
        <div className="flex items-center bg-neutral-900/90 border border-neutral-800 rounded-full p-0.5 text-xs">
          <button
            onClick={() => onVersionChange('v1')}
            className={`px-3 py-1.5 rounded-full font-medium transition-all ${
              activeVersion === 'v1'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
            title="Version 1: Baseline Vedic Astrologer"
          >
            V1
          </button>
          <button
            onClick={() => onVersionChange('v2')}
            className={`px-3 py-1.5 rounded-full font-medium transition-all ${
              activeVersion === 'v2'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
            title="Version 2: Intervention"
          >
            V2
          </button>
        </div>
      </div>

      {/* Right: Voice / Settings Icon */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onOpenSettings}
          aria-label="Settings"
          className="flex items-center justify-center w-11 h-11 text-neutral-200 bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800/80 rounded-full transition-colors active:scale-95"
        >
          <SlidersHorizontal className="w-4 h-4 text-neutral-300" strokeWidth={2.2} />
        </button>
      </div>
    </header>
  );
};
