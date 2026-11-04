/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FastForward, Zap } from 'lucide-react';
import { BottomActionBar } from './components/BottomActionBar';
import { BirthPromptModal } from './components/BirthPromptModal';
import { ChatTranscript } from './components/ChatTranscript';
import { ExpressiveOrb } from './components/ExpressiveOrb';
import { FluidOrb } from './components/FluidOrb';
import { PermissionModal } from './components/PermissionModal';
import { SettingsModal } from './components/SettingsModal';
import { TopHeader } from './components/TopHeader';
import { useVoiceChat } from './hooks/useVoiceChat';
import {
  ChatMessage,
  generateAssistantResponse,
  formatToDirectShortAnswer,
} from './services/geminiService';
import { BirthDetails, VedicChartResult } from './services/vedicEngine';
import { playPing, setAudioFeedbackEnabled } from './utils/soundEffects';

export default function App() {
  const [activeVersion, setActiveVersion] = useState<'v1' | 'v2'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const v = params.get('v') || params.get('version');
      if (v === '1' || v === 'v1') return 'v1';
      if (v === '2' || v === 'v2') return 'v2';
    }
    return 'v2';
  });

  const [isVoiceMode, setIsVoiceMode] = useState<boolean>(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [collectedBirthDetails, setCollectedBirthDetails] = useState<BirthDetails | undefined>();
  const [isTranscriptOpen, setIsTranscriptOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isBirthModalOpen, setIsBirthModalOpen] = useState<boolean>(false);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState<boolean>(false);
  const [lastChart, setLastChart] = useState<VedicChartResult | undefined>();

  // Connectivity and Timeout states for automatic error expression integration
  const [isOffline, setIsOffline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );
  const [isTimedOut, setIsTimedOut] = useState<boolean>(false);
  const [isShortAnswerMode, setIsShortAnswerMode] = useState<boolean>(false);

  const isFetchingRef = useRef<boolean>(false);
  const isShortAnswerModeRef = useRef<boolean>(false);
  const timeoutTimerRef = useRef<any>(null);
  const lastPromptRef = useRef<string>('');
  const collectedBirthDetailsRef = useRef<BirthDetails | undefined>(collectedBirthDetails);
  const activeVersionRef = useRef<'v1' | 'v2'>(activeVersion);

  // Keep refs synced
  useEffect(() => {
    collectedBirthDetailsRef.current = collectedBirthDetails;
  }, [collectedBirthDetails]);

  useEffect(() => {
    activeVersionRef.current = activeVersion;
    setAudioFeedbackEnabled(activeVersion === 'v2');
  }, [activeVersion]);

  useEffect(() => {
    isShortAnswerModeRef.current = isShortAnswerMode;
  }, [isShortAnswerMode]);

  // Network connection monitor: immediately shows error expression if connection cuts
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setIsTimedOut(false);
    };
    const handleOffline = () => {
      setIsOffline(true);
      playPing('error');
      interrupt();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleVersionChange = (newVersion: 'v1' | 'v2') => {
    setActiveVersion(newVersion);
    activeVersionRef.current = newVersion;
    setAudioFeedbackEnabled(newVersion === 'v2');
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('v', newVersion === 'v2' ? '2' : '1');
      window.history.replaceState({}, '', url.toString());
    }
  };

  // Process assistant reply
  const processUserPrompt = useCallback(
    async (promptText: string, forceShortAnswer: boolean = false) => {
      const cleanPrompt = promptText.trim();
      if (!cleanPrompt) return;

      // Prevent concurrent duplicate fetch calls
      if (isFetchingRef.current) {
        return;
      }
      isFetchingRef.current = true;
      lastPromptRef.current = cleanPrompt;

      const useShort = forceShortAnswer || isShortAnswerModeRef.current;

      // Reset any previous timeout
      clearTimeout(timeoutTimerRef.current);
      setIsTimedOut(false);

      // Stop any current assistant speech synthesis immediately
      interrupt();
      setOrbState('thinking');

      // Error guard: Offline cut
      if (isOffline) {
        isFetchingRef.current = false;
        const offlineMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: 'Internet connection is offline. Please reconnect to continue our conversation.',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, offlineMsg]);
        speakText(offlineMsg.content);
        return;
      }

      // Timeout detection: If server response takes more than 11 seconds, trigger error expression
      timeoutTimerRef.current = setTimeout(() => {
        if (isFetchingRef.current) {
          isFetchingRef.current = false;
          setIsTimedOut(true);
          playPing('error');
          const timeoutMsg: ChatMessage = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: "The response is taking longer than usual. Please check your connection or tap the orb to retry.",
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, timeoutMsg]);
          speakText("Taking longer than usual. Please tap the orb to try again.");
        }
      }, 11000);

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: cleanPrompt,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);

      try {
        const response = await generateAssistantResponse(
          cleanPrompt,
          messages,
          collectedBirthDetailsRef.current,
          activeVersionRef.current,
          useShort
        );

        // Cancel timeout on successful arrival
        clearTimeout(timeoutTimerRef.current);
        setIsTimedOut(false);

        if (response.chartData) {
          collectedBirthDetailsRef.current = response.chartData.birthDetails;
          setLastChart(response.chartData);
          setCollectedBirthDetails(response.chartData.birthDetails);
        } else if (response.partialBirthDetails) {
          collectedBirthDetailsRef.current = response.partialBirthDetails;
          setCollectedBirthDetails(response.partialBirthDetails);
        }

        const assistantMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response.text,
          timestamp: new Date(),
          isAstrology: response.isAstrology,
          chartData: response.chartData,
        };

        setMessages((prev) => [...prev, assistantMsg]);
        isFetchingRef.current = false;

        // Reset speed to 1x by default for every new answer
        resetSpeechRate();

        // Speak response out loud in voice mode (user can barge-in at any time)
        speakText(response.text, undefined, 1.0);
      } catch (err) {
        console.error('Failed to generate response:', err);
        playPing('error');
        clearTimeout(timeoutTimerRef.current);
        isFetchingRef.current = false;
        const errMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: "I'm having trouble processing that right now. Could you please try again?",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errMsg]);
        speakText(errMsg.content);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [messages, collectedBirthDetails, isOffline]
  );

  // Hook for Web Audio API, Speech Recognition, & Synthesis
  const {
    orbState,
    setOrbState,
    audioLevel,
    isMuted,
    isListening,
    interimTranscript,
    currentSpeakingText,
    selectedVoice,
    setSelectedVoice,
    availableVoices,
    speechRate,
    setSpeechRate,
    resetSpeechRate,
    fastForward,
    hasMicPermission,
    permissionError,
    requestPermission,
    interrupt,
    toggleMute,
    speakText,
  } = useVoiceChat({
    onUserSpeechFinal: (transcript) => {
      processUserPrompt(transcript);
    },
  });

  const handleOrbTap = async () => {
    // If timed out, tap to retry the last query
    if (isTimedOut) {
      setIsTimedOut(false);
      if (lastPromptRef.current) {
        processUserPrompt(lastPromptRef.current);
        return;
      }
    }

    // If mic permission is not yet granted, request permission on tap
    if (hasMicPermission !== true) {
      const granted = await requestPermission();
      if (!granted) {
        setIsPermissionModalOpen(true);
      }
      return;
    }

    // Otherwise interrupt if speaking
    clearTimeout(timeoutTimerRef.current);
    isFetchingRef.current = false;
    interrupt();
  };

  const handleFastForward = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextRate = fastForward();
    // If not currently speaking, re-read the last assistant answer at the new speed
    if (effectiveOrbState !== 'speaking') {
      const lastAssistantMsg = [...messages].reverse().find((m) => m.role === 'assistant');
      if (lastAssistantMsg) {
        speakText(lastAssistantMsg.content, undefined, nextRate);
      }
    }
  };

  const handleSkipToShortAnswer = (e: React.MouseEvent) => {
    e.stopPropagation();

    // 1. If an assistant answer exists: deliver direct short final answer (<40 words) immediately
    const lastAssistantMsg = [...messages].reverse().find((m) => m.role === 'assistant');
    if (lastAssistantMsg) {
      interrupt();
      const shortText = formatToDirectShortAnswer(lastAssistantMsg.content);
      const shortAssistantMsg: ChatMessage = {
        id: `assistant-short-${Date.now()}`,
        role: 'assistant',
        content: shortText,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, shortAssistantMsg]);
      speakText(shortText);
      return;
    }

    // 2. If user has active interim speech or is talking, commit immediately with short answer
    if (interimTranscript) {
      const pendingTranscript = interimTranscript;
      setIsShortAnswerMode(true);
      isShortAnswerModeRef.current = true;
      processUserPrompt(pendingTranscript, true);
    }
  };

  const handleManualBirthSubmit = (details: BirthDetails, query?: string) => {
    setCollectedBirthDetails(details);
    const prompt = query
      ? `Please analyze my birth chart for ${query}. My birth details are Date: ${details.date}, Time: ${details.time} ${details.isPM ? 'PM' : 'AM'}, Place: ${details.place}.`
      : `Act as a Vedic astrologer. Here are my birth details: Date of Birth: ${details.date}, Time: ${details.time} ${details.isPM ? 'PM' : 'AM'}, Place: ${details.place}.`;

    processUserPrompt(prompt);
  };

  // Organic system-driven orb state (no manual toggles!)
  const effectiveOrbState =
    isOffline || isTimedOut || hasMicPermission === false ? 'error' : orbState;

  const hasAssistantAnswer = messages.some((m) => m.role === 'assistant');

  const getStatusLabel = () => {
    if (isOffline) return '⚠️ Offline: Internet connection cut';
    if (isTimedOut) return '⏱️ Response took too long — tap orb to retry';
    if (hasMicPermission === false) return 'Tap orb to enable microphone';
    if (isMuted) return 'Muted';
    if (interimTranscript) return `"${interimTranscript}"`;
    if (effectiveOrbState === 'speaking') {
      const lastAssistantMsg = [...messages].reverse().find((m) => m.role === 'assistant');
      const text = currentSpeakingText || lastAssistantMsg?.content;
      return text ? `"${text}"` : "Hey! I'm listening";
    }
    if (effectiveOrbState === 'thinking') {
      const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
      const text = lastUserMsg?.content || lastPromptRef.current;
      return text ? `"${text}"` : "Hey! I'm listening";
    }
    // Keep showing the answer transcript so it doesn't disappear when speech finishes
    const lastAssistantMsg = [...messages].reverse().find((m) => m.role === 'assistant');
    if (lastAssistantMsg?.content) {
      return `"${lastAssistantMsg.content}"`;
    }
    return "Hey! I'm listening";
  };

  return (
    <div className="relative flex flex-col h-[100dvh] w-full max-w-lg mx-auto bg-black text-white overflow-hidden select-none">
      {/* Top Mobile Header */}
      <TopHeader
        isVoiceMode={isVoiceMode}
        isListening={isListening && !isMuted}
        hasMicPermission={hasMicPermission}
        activeVersion={activeVersion}
        onVersionChange={handleVersionChange}
        onToggleTranscript={() => setIsTranscriptOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenPermissionModal={() => setIsPermissionModalOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1 flex flex-col items-center justify-center relative px-6 overflow-hidden">
        {isVoiceMode ? (
          <div className="flex flex-col items-center justify-center space-y-3.5 animate-in fade-in zoom-in-95 duration-300">
            {/* Center Orb (Fluid in V1, Expressive Squarish in V2) */}
            <div className="relative flex items-center justify-center">
              {activeVersion === 'v1' ? (
                <FluidOrb
                  state={orbState}
                  audioLevel={audioLevel}
                  onInterrupt={handleOrbTap}
                />
              ) : (
                <ExpressiveOrb
                  state={effectiveOrbState}
                  audioLevel={audioLevel}
                  onInterrupt={handleOrbTap}
                />
              )}
            </div>

            {/* Live speech transcription text (Version 2 only, removed from Version 1) */}
            {activeVersion === 'v2' && getStatusLabel() ? (
              <div className="flex flex-col items-center text-center px-4 max-w-sm animate-in fade-in duration-150">
                <p
                  className={`text-xs tracking-wide font-normal line-clamp-3 ${
                    isOffline || isTimedOut
                      ? 'text-rose-400 font-medium'
                      : 'text-neutral-400'
                  }`}
                >
                  {getStatusLabel()}
                </p>
              </div>
            ) : null}

            {/* Version 2 Only: Action buttons shown for all answers, staying visible without hiding */}
            {activeVersion === 'v2' &&
              (hasAssistantAnswer || effectiveOrbState === 'speaking') &&
              !interimTranscript &&
              effectiveOrbState !== 'thinking' && (
                <div className="flex items-center justify-center gap-2 pt-1 animate-in fade-in duration-200">
                  {/* Speed Button (1x -> 1.5x -> 2x -> 1x) */}
                  <button
                    type="button"
                    onClick={handleFastForward}
                    title="Speed up or slow down (1x, 1.5x, 2x)"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 active:scale-95 border border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white"
                  >
                    <FastForward className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{speechRate >= 1.8 ? '2x' : speechRate >= 1.3 ? '1.5x' : '1x'}</span>
                  </button>

                  {/* Skip to Short Answer Button (Direct answer + follow-up under 40 words, no highlights, pure grey) */}
                  <button
                    type="button"
                    onClick={handleSkipToShortAnswer}
                    title="Skip to final answer and follow-up (under 40 words)"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 active:scale-95 border border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white"
                  >
                    <Zap className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Skip to short answer</span>
                  </button>
                </div>
              )}
          </div>
        ) : (
          /* Text Chat Mode inline feed */
          <div className="flex-1 w-full overflow-y-auto py-4 space-y-4 px-2">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-neutral-500 space-y-2">
                <p className="text-sm">Ready to chat.</p>
                <p className="text-xs text-neutral-600">
                  Ask anything or tap the blue orb to enter Advanced Voice Mode.
                </p>
              </div>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${
                    m.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-neutral-800 text-neutral-100'
                        : 'bg-neutral-900 border border-neutral-800 text-neutral-200'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{m.content}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* Bottom Action Bar */}
      <BottomActionBar
        isVoiceMode={isVoiceMode}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        onExitVoiceMode={() => setIsVoiceMode(false)}
        onEnterVoiceMode={async () => {
          setIsVoiceMode(true);
          if (hasMicPermission !== true) {
            await requestPermission();
          }
        }}
        onSendMessage={processUserPrompt}
        onOpenQuickPrompt={() => setIsBirthModalOpen(true)}
      />

      {/* Full Transcript History Slide-over */}
      <ChatTranscript
        isOpen={isTranscriptOpen}
        messages={messages}
        onClose={() => setIsTranscriptOpen(false)}
        onClear={() => setMessages([])}
        onReplaySpeech={speakText}
        onEnterVoiceMode={() => {
          setIsTranscriptOpen(false);
          setIsVoiceMode(true);
          if (hasMicPermission !== true) {
            requestPermission();
          }
        }}
      />

      {/* Easy Permission Modal */}
      <PermissionModal
        isOpen={isPermissionModalOpen}
        hasMicPermission={hasMicPermission}
        permissionError={permissionError}
        onRequestPermission={requestPermission}
        onDismiss={() => setIsPermissionModalOpen(false)}
      />

      {/* Settings Modal (Audio Voice, Speech Rate, Version Switcher) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        activeVersion={activeVersion}
        onSelectVersion={handleVersionChange}
        availableVoices={availableVoices}
        selectedVoice={selectedVoice}
        onSelectVoice={setSelectedVoice}
        speechRate={speechRate}
        onSelectRate={setSpeechRate}
      />

      {/* Quick Vedic Birth Details Modal (+) */}
      <BirthPromptModal
        isOpen={isBirthModalOpen}
        onClose={() => setIsBirthModalOpen(false)}
        onSubmit={handleManualBirthSubmit}
        initialDetails={collectedBirthDetails}
      />
    </div>
  );
}
