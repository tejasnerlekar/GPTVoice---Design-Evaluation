import React, { useEffect, useRef } from 'react';
import { ArrowLeft, AudioLines, Sparkles, Trash2, Volume2 } from 'lucide-react';
import { ChatMessage } from '../services/geminiService';

interface ChatTranscriptProps {
  messages: ChatMessage[];
  isOpen: boolean;
  onClose: () => void;
  onClear: () => void;
  onReplaySpeech: (text: string) => void;
  onEnterVoiceMode: () => void;
}

export const ChatTranscript: React.FC<ChatTranscriptProps> = ({
  messages,
  isOpen,
  onClose,
  onClear,
  onReplaySpeech,
  onEnterVoiceMode,
}) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-black text-white select-none animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-900 bg-neutral-950/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            aria-label="Back to Voice Mode"
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-neutral-800 text-neutral-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm tracking-tight text-white">Transcript History</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400">
              {messages.length} messages
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onEnterVoiceMode}
            aria-label="Switch back to voice orb"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-transform active:scale-95 shadow-md shadow-blue-900/40"
          >
            <AudioLines className="w-3.5 h-3.5" />
            <span>Voice Orb</span>
          </button>
          {messages.length > 0 && (
            <button
              onClick={onClear}
              aria-label="Clear chat transcript"
              className="flex items-center justify-center w-9 h-9 rounded-full text-neutral-400 hover:text-red-400 hover:bg-neutral-900 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Message Feed */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-neutral-500 space-y-3 px-6">
            <Sparkles className="w-8 h-8 text-neutral-600" />
            <p className="text-sm font-medium">No conversation recorded yet.</p>
            <p className="text-xs text-neutral-500 max-w-xs">
              Tap the orb or speak into your microphone to start talking with ChatGPT or consult the Vedic Astrologer.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-neutral-800 text-neutral-100 rounded-br-xs'
                    : 'bg-neutral-900/90 border border-neutral-800/80 text-neutral-200 rounded-bl-xs'
                }`}
              >
                {/* Assistant header tag */}
                {msg.role === 'assistant' && (
                  <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-neutral-800/60 text-[11px] text-neutral-400">
                    <span className="font-semibold text-neutral-300">
                      {msg.isAstrology ? 'Vedic Jyotishi' : 'ChatGPT'}
                    </span>
                    <button
                      onClick={() => onReplaySpeech(msg.content)}
                      aria-label="Replay speech"
                      className="flex items-center gap-1 text-sky-400 hover:text-sky-300 transition-colors"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Listen</span>
                    </button>
                  </div>
                )}

                <div className="whitespace-pre-wrap select-text">{msg.content}</div>
              </div>

              <span className="text-[10px] text-neutral-500 mt-1 px-1">
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
