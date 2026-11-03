/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useState } from 'react';
import { BottomActionBar } from './components/BottomActionBar';
import { BirthPromptModal } from './components/BirthPromptModal';
import { ChatTranscript } from './components/ChatTranscript';
import { FluidOrb } from './components/FluidOrb';
import { PermissionModal } from './components/PermissionModal';
import { SettingsModal } from './components/SettingsModal';
import { TopHeader } from './components/TopHeader';
import { useVoiceChat } from './hooks/useVoiceChat';
import {
  ChatMessage,
  generateAssistantResponse,
} from './services/geminiService';
import { BirthDetails, VedicChartResult } from './services/vedicEngine';

export default function App() {
  const [activeVersion, setActiveVersion] = useState<'v1' | 'v2'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const v = params.get('v') || params.get('version');
      if (v === '2' || v === 'v2') return 'v2';
    }
    return 'v1';
  });
  const [isVoiceMode, setIsVoiceMode] = useState<boolean>(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [collectedBirthDetails, setCollectedBirthDetails] = useState<BirthDetails | undefined>();
  const [isTranscriptOpen, setIsTranscriptOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isBirthModalOpen, setIsBirthModalOpen] = useState<boolean>(false);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState<boolean>(false);
  const [lastChart, setLastChart] = useState<VedicChartResult | undefined>();
  const isFetchingRef = React.useRef<boolean>(false);
  const collectedBirthDetailsRef = React.useRef<BirthDetails | undefined>(collectedBirthDetails);
  const activeVersionRef = React.useRef<'v1' | 'v2'>(activeVersion);

  // Keep ref synced
  React.useEffect(() => {
    collectedBirthDetailsRef.current = collectedBirthDetails;
  }, [collectedBirthDetails]);

  React.useEffect(() => {
    activeVersionRef.current = activeVersion;
  }, [activeVersion]);

  const handleVersionChange = (newVersion: 'v1' | 'v2') => {
    setActiveVersion(newVersion);
    activeVersionRef.current = newVersion;
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('v', newVersion === 'v2' ? '2' : '1');
      window.history.replaceState({}, '', url.toString());
    }
  };

  // Process assistant reply
  const processUserPrompt = useCallback(
    async (promptText: string) => {
      const cleanPrompt = promptText.trim();
      if (!cleanPrompt) return;

      // Prevent concurrent duplicate fetch calls
      if (isFetchingRef.current) {
        return;
      }
      isFetchingRef.current = true;

      // Stop any current assistant speech synthesis immediately
      interrupt();
      setOrbState('thinking');

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
          activeVersionRef.current
        );

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

        // Speak response out loud in voice mode (user can barge-in at any time)
        speakText(response.text);
      } catch (err) {
        console.error('Failed to generate response:', err);
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
    [messages, collectedBirthDetails]
  );

  // Hook for Web Audio API, Speech Recognition, & Synthesis
  const {
    orbState,
    setOrbState,
    audioLevel,
    isMuted,
    isListening,
    interimTranscript,
    selectedVoice,
    setSelectedVoice,
    availableVoices,
    speechRate,
    setSpeechRate,
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
    // If mic permission is not yet granted, request permission on tap
    if (hasMicPermission !== true) {
      const granted = await requestPermission();
      if (!granted) {
        setIsPermissionModalOpen(true);
      }
      return;
    }
    // Otherwise interrupt if speaking
    isFetchingRef.current = false;
    interrupt();
  };

  const handleManualBirthSubmit = (details: BirthDetails, query?: string) => {
    setCollectedBirthDetails(details);
    const prompt = query
      ? `Please analyze my birth chart for ${query}. My birth details are Date: ${details.date}, Time: ${details.time} ${details.isPM ? 'PM' : 'AM'}, Place: ${details.place}.`
      : `Act as a Vedic astrologer. Here are my birth details: Date of Birth: ${details.date}, Time: ${details.time} ${details.isPM ? 'PM' : 'AM'}, Place: ${details.place}.`;

    processUserPrompt(prompt);
  };

  const getStatusLabel = () => {
    if (interimTranscript) return `"${interimTranscript}"`;
    if (isMuted) return 'Muted';
    return '';
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
          <div className="flex flex-col items-center justify-center space-y-4 animate-in fade-in zoom-in-95 duration-300">
            {/* Center Fluid Orb */}
            <div className="relative flex items-center justify-center">
              <FluidOrb
                state={orbState}
                audioLevel={audioLevel}
                onInterrupt={handleOrbTap}
              />
            </div>

            {/* Live speech transcription text (visible only when actively speaking) */}
            {getStatusLabel() ? (
              <div className="flex flex-col items-center text-center px-4 animate-in fade-in duration-150">
                <p className="text-xs tracking-wide text-neutral-400 font-normal">
                  {getStatusLabel()}
                </p>
              </div>
            ) : null}
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

      {/* Settings Modal (API Key, Neural Voice, Deploy Guide) */}
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
