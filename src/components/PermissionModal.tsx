import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, ChevronRight, Mic, ShieldCheck, X } from 'lucide-react';

interface PermissionModalProps {
  isOpen: boolean;
  hasMicPermission: boolean | null;
  permissionError: string | null;
  onRequestPermission: () => Promise<boolean>;
  onDismiss: () => void;
}

export const PermissionModal: React.FC<PermissionModalProps> = ({
  isOpen,
  hasMicPermission,
  permissionError,
  onRequestPermission,
  onDismiss,
}) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const [activeTab, setActiveTab] = useState<'chrome' | 'safari'>('chrome');

  if (!isOpen) return null;

  const handleAllowClick = async () => {
    setIsRequesting(true);
    try {
      await onRequestPermission();
    } finally {
      setIsRequesting(false);
    }
  };

  const isDenied = hasMicPermission === false;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md select-none p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-t-3xl sm:rounded-2xl p-6 text-white max-h-[92vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl ${isDenied ? 'bg-amber-950/60 text-amber-400 border border-amber-800/60' : 'bg-blue-950/60 text-blue-400 border border-blue-800/60'}`}>
              {isDenied ? <AlertCircle className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-semibold leading-tight">
                {isDenied ? 'Microphone Permission Needed' : 'Enable Voice Mode'}
              </h2>
              <span className="text-[11px] text-neutral-400">
                {isDenied ? 'Browser access is currently blocked' : '1-tap setup for real-time speech'}
              </span>
            </div>
          </div>
          <button
            onClick={onDismiss}
            aria-label="Dismiss permission prompt"
            className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="py-3 space-y-4">
          {!isDenied ? (
            /* First-time permission request explanation */
            <div className="space-y-3.5">
              <p className="text-xs text-neutral-300 leading-relaxed">
                ChatGPT Advanced Voice Mode requires microphone access so you can speak naturally, hear spoken answers, and watch the central fluid orb react to your voice in real time.
              </p>

              <div className="space-y-2 rounded-xl bg-neutral-950/70 border border-neutral-800/80 p-3">
                <div className="flex items-start gap-2.5 text-xs text-neutral-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Private & Local:</strong> Speech is processed directly in your browser using standard Web Speech & Web Audio APIs.
                  </span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-neutral-300">
                  <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Vedic Astrologer Engine:</strong> Real-time sub-15ms Kundali calculations run instantly in pure TypeScript.
                  </span>
                </div>
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleAllowClick}
                  disabled={isRequesting}
                  className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-transform active:scale-98 shadow-lg shadow-blue-900/40 disabled:opacity-50"
                >
                  <Mic className="w-4 h-4" />
                  <span>{isRequesting ? 'Requesting Permission...' : 'Allow Microphone & Start Voice'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Denied troubleshooting instructions */
            <div className="space-y-3.5">
              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/40 text-xs text-amber-300/90 leading-relaxed">
                {permissionError || 'The browser blocked access to the microphone. Follow the quick steps below to enable it:'}
              </div>

              {/* Platform selector */}
              <div className="flex p-1 rounded-xl bg-neutral-950 border border-neutral-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('chrome')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    activeTab === 'chrome' ? 'bg-neutral-800 text-white shadow-xs' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Chrome / Android
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('safari')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    activeTab === 'safari' ? 'bg-neutral-800 text-white shadow-xs' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  iPhone / Safari
                </button>
              </div>

              {/* Step instructions */}
              <div className="space-y-2 text-xs text-neutral-300 bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                {activeTab === 'chrome' ? (
                  <ol className="list-decimal list-inside space-y-1.5 leading-normal">
                    <li>Tap the <strong>lock / tune icon (🔒)</strong> in your browser address bar.</li>
                    <li>Tap <strong>Permissions</strong> &gt; <strong>Microphone</strong>.</li>
                    <li>Switch the toggle to <strong>Allow</strong>.</li>
                    <li>Tap the button below to resume.</li>
                  </ol>
                ) : (
                  <ol className="list-decimal list-inside space-y-1.5 leading-normal">
                    <li>Tap the <strong>aA</strong> or page settings icon on the left of the address bar.</li>
                    <li>Select <strong>Website Settings</strong>.</li>
                    <li>Set <strong>Microphone</strong> to <strong>Allow</strong>.</li>
                    <li>Tap the button below to resume.</li>
                  </ol>
                )}
              </div>

              <div className="pt-1 flex gap-2">
                <button
                  type="button"
                  onClick={handleAllowClick}
                  disabled={isRequesting}
                  className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-transform active:scale-98 disabled:opacity-50"
                >
                  <Mic className="w-4 h-4" />
                  <span>{isRequesting ? 'Testing...' : 'Try Again'}</span>
                </button>
                <button
                  type="button"
                  onClick={onDismiss}
                  className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition-colors"
                >
                  Text Mode
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-500">
          <span>You can change permissions at any time</span>
          <button
            onClick={onDismiss}
            className="text-neutral-400 hover:text-white flex items-center gap-0.5 font-medium"
          >
            <span>Continue to chat</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
