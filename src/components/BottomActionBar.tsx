import React, { useState } from 'react';
import { ArrowUp, Mic, MicOff, Plus, X, AudioLines } from 'lucide-react';

interface BottomActionBarProps {
  isVoiceMode: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onExitVoiceMode: () => void;
  onEnterVoiceMode: () => void;
  onSendMessage: (text: string) => void;
  onOpenQuickPrompt: () => void;
}

export const BottomActionBar: React.FC<BottomActionBarProps> = ({
  isVoiceMode,
  isMuted,
  onToggleMute,
  onExitVoiceMode,
  onEnterVoiceMode,
  onSendMessage,
  onOpenQuickPrompt,
}) => {
  const [inputText, setInputText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  return (
    <div className="relative z-30 w-full px-4 pb-6 pt-2 select-none">
      <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
        {/* Left: Rounded pill input */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 flex items-center bg-neutral-900 border border-neutral-800/90 rounded-full px-2.5 py-1.5 focus-within:border-neutral-600 transition-colors shadow-lg"
        >
          <button
            type="button"
            onClick={onOpenQuickPrompt}
            aria-label="Add or ask birth details"
            className="flex items-center justify-center w-8 h-8 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask ChatGPT"
            className="w-full bg-transparent text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none px-2.5 py-1"
          />

          {inputText.trim() ? (
            <button
              type="submit"
              aria-label="Send message"
              className="flex items-center justify-center w-8 h-8 rounded-full bg-white text-black hover:bg-neutral-200 transition-transform active:scale-95 shrink-0"
            >
              <ArrowUp className="w-4 h-4" strokeWidth={3} />
            </button>
          ) : (
            <div className="w-2" />
          )}
        </form>

        {/* Right Action Buttons */}
        {isVoiceMode ? (
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Mic Mute / Unmute Button */}
            <button
              type="button"
              onClick={onToggleMute}
              aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
              className={`flex items-center justify-center w-11 h-11 rounded-full border transition-all active:scale-95 ${
                isMuted
                  ? 'bg-red-950/60 border-red-800/80 text-red-300'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-200 hover:bg-neutral-800'
              }`}
            >
              {isMuted ? (
                <MicOff className="w-5 h-5 text-red-400" />
              ) : (
                <Mic className="w-5 h-5 text-neutral-300" />
              )}
            </button>

            {/* Exit Voice Mode 'X' Button */}
            <button
              type="button"
              onClick={onExitVoiceMode}
              aria-label="Close voice mode"
              className="flex items-center justify-center w-11 h-11 rounded-full bg-white text-black hover:bg-neutral-200 transition-all active:scale-95 shadow-md"
            >
              <X className="w-5 h-5" strokeWidth={2.5} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 shrink-0">
            {/* Mic button */}
            <button
              type="button"
              onClick={onEnterVoiceMode}
              aria-label="Start voice mode"
              className="flex items-center justify-center w-10 h-10 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white transition-colors"
            >
              <Mic className="w-4 h-4" />
            </button>

            {/* Blue Waveform Voice Button matching Image 1 */}
            <button
              type="button"
              onClick={onEnterVoiceMode}
              aria-label="Launch Advanced Voice Mode"
              className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 text-white transition-transform active:scale-95 shadow-lg shadow-blue-900/40"
            >
              <AudioLines className="w-5 h-5" strokeWidth={2.4} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
