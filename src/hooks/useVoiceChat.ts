import { useCallback, useEffect, useRef, useState } from 'react';
import { OrbState } from '../components/FluidOrb';

interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export function useVoiceChat({
  onUserSpeechFinal,
}: {
  onUserSpeechFinal: (transcript: string) => void;
}) {
  const [orbState, setOrbState] = useState<OrbState>('idle');
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speechRate, setSpeechRate] = useState<number>(1.05);
  const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Synchronous refs to prevent race conditions and stale closures
  const isMutedRef = useRef<boolean>(false);
  const isSpeakingRef = useRef<boolean>(false);
  const speakingTextRef = useRef<string>('');
  const isProcessingRef = useRef<boolean>(false);
  const hasMicPermissionRef = useRef<boolean | null>(null);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);
  const restartTimerRef = useRef<any>(null);
  const transcriptBufferRef = useRef<string>('');
  const ttsIntervalRef = useRef<any>(null);
  const echoCooldownTimerRef = useRef<any>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const onUserSpeechFinalRef = useRef(onUserSpeechFinal);
  const selectedVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

  // Sync state & callback to refs
  useEffect(() => {
    onUserSpeechFinalRef.current = onUserSpeechFinal;
  }, [onUserSpeechFinal]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    hasMicPermissionRef.current = hasMicPermission;
  }, [hasMicPermission]);

  useEffect(() => {
    selectedVoiceRef.current = selectedVoice;
  }, [selectedVoice]);

  // Load and consistently pick ONE natural voice
  useEffect(() => {
    const updateVoices = () => {
      if (typeof window === 'undefined' || !window.speechSynthesis) return;
      const voices = window.speechSynthesis.getVoices();
      if (!voices || voices.length === 0) return;

      setAvailableVoices(voices);

      if (!selectedVoiceRef.current) {
        const englishVoices = voices.filter((v) => v.lang.startsWith('en'));
        const chosenVoice =
          englishVoices.find(
            (v) =>
              v.name.includes('Natural') ||
              v.name.includes('Google US English') ||
              v.name.includes('Samantha') ||
              v.name.includes('Jenny')
          ) ||
          englishVoices[0] ||
          voices[0];

        setSelectedVoice(chosenVoice);
        selectedVoiceRef.current = chosenVoice;
      }
    };

    updateVoices();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  // Safe restart helper that resiliently keeps listening alive when not speaking
  const restartListening = useCallback(() => {
    if (isMutedRef.current || !hasMicPermissionRef.current) return;
    if (isSpeakingRef.current || isProcessingRef.current) return;
    if (!recognitionRef.current) return;

    clearTimeout(restartTimerRef.current);
    restartTimerRef.current = setTimeout(() => {
      if (isMutedRef.current || !hasMicPermissionRef.current) return;
      if (isSpeakingRef.current || isProcessingRef.current) return;
      try {
        recognitionRef.current.start();
        setIsListening(true);
        if (!isSpeakingRef.current && !isProcessingRef.current) {
          setOrbState('listening');
        }
      } catch (err: any) {
        if (err.name === 'InvalidStateError') {
          setIsListening(true);
        }
      }
    }, 150);
  }, []);

  // Commit accumulated speech buffer to final processing
  const commitTranscript = useCallback(() => {
    const fullUtterance = transcriptBufferRef.current.trim();
    if (fullUtterance && !isProcessingRef.current) {
      transcriptBufferRef.current = '';
      setInterimTranscript('');
      isProcessingRef.current = true;
      setOrbState('thinking');
      onUserSpeechFinalRef.current(fullUtterance);
    }
  }, []);

  // Initialize Speech Recognition
  const initSpeechRecognition = useCallback(() => {
    const win = window as IWindow;
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRec) {
      console.warn('Speech recognition not supported in this browser.');
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
    }

    const recognition = new SpeechRec();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      if (!isSpeakingRef.current && !isProcessingRef.current) {
        setOrbState('listening');
      }
    };

    recognition.onresult = (event: any) => {
      // Acoustic echo shield: drop all microphone input while assistant is speaking or processing
      if (isSpeakingRef.current || isProcessingRef.current) {
        return;
      }

      let currentInterim = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item.isFinal) {
          finalTranscript += item[0].transcript;
        } else {
          currentInterim += item[0].transcript;
        }
      }

      const cleanInterim = currentInterim.trim();
      const cleanFinal = finalTranscript.trim();
      const rawIncoming = (cleanFinal + ' ' + cleanInterim).trim();

      if (!rawIncoming) return;

      if (cleanFinal) {
        transcriptBufferRef.current = (transcriptBufferRef.current + ' ' + cleanFinal).trim();
      }

      // Keep user's full accumulated words visible so they know the AI is listening
      const combinedDisplay = (transcriptBufferRef.current + ' ' + cleanInterim).trim();
      setInterimTranscript(combinedDisplay);

      // Adaptive conversational pause: 2000ms pause window allows natural pauses between birth details
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        commitTranscript();
      }, 2000);
    };

    recognition.onerror = (e: any) => {
      if (e.error === 'no-speech' || e.error === 'aborted') {
        if (!isMutedRef.current && !isSpeakingRef.current && !isProcessingRef.current) {
          restartListening();
        }
        return;
      }
      if (e.error === 'not-allowed') {
        setHasMicPermission(false);
        setPermissionError('Microphone permission was not allowed.');
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      if (!isMutedRef.current && hasMicPermissionRef.current && !isSpeakingRef.current && !isProcessingRef.current) {
        restartListening();
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      // ignore
    }
  }, [commitTranscript, restartListening]);

  // Request Microphone and Audio Permissions explicitly on user gesture
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      setPermissionError(null);

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioContextRef.current && AudioCtx) {
        audioContextRef.current = new AudioCtx();
      }
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      micStreamRef.current = stream;
      setHasMicPermission(true);
      hasMicPermissionRef.current = true;
      setPermissionError(null);

      if (audioContextRef.current) {
        const analyser = audioContextRef.current.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.5;
        analyserRef.current = analyser;

        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateVolume = () => {
          if (!analyserRef.current || isMutedRef.current) {
            if (!isSpeakingRef.current) setAudioLevel(0);
            animationFrameRef.current = requestAnimationFrame(updateVolume);
            return;
          }

          if (isSpeakingRef.current) {
            animationFrameRef.current = requestAnimationFrame(updateVolume);
            return;
          }

          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          const normalized = Math.min(1, Math.max(0, (avg - 12) / 60));
          setAudioLevel(normalized);

          animationFrameRef.current = requestAnimationFrame(updateVolume);
        };

        if (!animationFrameRef.current) {
          animationFrameRef.current = requestAnimationFrame(updateVolume);
        }
      }

      initSpeechRecognition();
      return true;
    } catch (err: any) {
      console.warn('Microphone permission rejected:', err);
      setHasMicPermission(false);
      hasMicPermissionRef.current = false;
      setPermissionError('Microphone permission was not allowed.');
      return false;
    }
  }, [initSpeechRecognition]);

  // Interrupt active speech (called on orb tap)
  const interrupt = useCallback(() => {
    clearTimeout(echoCooldownTimerRef.current);
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    isSpeakingRef.current = false;
    isProcessingRef.current = false;
    speakingTextRef.current = '';
    transcriptBufferRef.current = '';
    clearTimeout(silenceTimerRef.current);
    clearInterval(ttsIntervalRef.current);
    setAudioLevel(0);
    setOrbState(isMutedRef.current ? 'idle' : 'listening');
    restartListening();
  }, [restartListening]);

  // Toggle Mute
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      isMutedRef.current = next;
      if (next) {
        interrupt();
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch {}
        }
        setOrbState('idle');
      } else {
        restartListening();
        setOrbState('listening');
      }
      return next;
    });
  }, [interrupt, restartListening]);

  // Single voice synthesizer authority with strict acoustic echo protection
  const speakText = useCallback(
    (text: string, onDone?: () => void) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        isProcessingRef.current = false;
        speakingTextRef.current = '';
        restartListening();
        if (onDone) onDone();
        return;
      }

      // 1. Halt any prior speech synthesis and clear cooldown timer
      clearTimeout(echoCooldownTimerRef.current);
      window.speechSynthesis.cancel();
      clearInterval(ttsIntervalRef.current);

      // 2. Shut off microphone completely while assistant speaks to prevent hearing its own voice
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
      setIsListening(false);

      const cleanText = text
        .replace(/[*_#`~]/g, '')
        .replace(/https?:\/\/\S+/g, '')
        .trim();

      if (!cleanText) {
        isProcessingRef.current = false;
        speakingTextRef.current = '';
        restartListening();
        if (onDone) onDone();
        return;
      }

      setOrbState('speaking');
      isSpeakingRef.current = true;
      speakingTextRef.current = cleanText.toLowerCase();
      isProcessingRef.current = false;

      // Organic orb pulsing to speech rhythm
      let step = 0;
      ttsIntervalRef.current = setInterval(() => {
        step += 0.25;
        const wave = (Math.sin(step) + 1) * 0.35 + Math.random() * 0.15;
        setAudioLevel(wave);
      }, 60);

      const utterance = new SpeechSynthesisUtterance(cleanText);

      // Consistently lock to ONE voice instance
      const voiceToUse = selectedVoiceRef.current || selectedVoice;
      if (voiceToUse) {
        utterance.voice = voiceToUse;
      }
      utterance.rate = speechRate;
      utterance.pitch = 1.0;

      const finishSpeech = () => {
        isSpeakingRef.current = false;
        isProcessingRef.current = false;
        speakingTextRef.current = '';
        clearInterval(ttsIntervalRef.current);
        setAudioLevel(0);
        setOrbState(isMutedRef.current ? 'idle' : 'listening');

        // Post-speech echo shield cooldown: wait 450ms for room audio reverberations to dissipate
        clearTimeout(echoCooldownTimerRef.current);
        echoCooldownTimerRef.current = setTimeout(() => {
          if (!isSpeakingRef.current && !isProcessingRef.current && !isMutedRef.current) {
            restartListening();
          }
        }, 450);

        if (onDone) onDone();
      };

      utterance.onend = finishSpeech;
      utterance.onerror = finishSpeech;

      // Trigger single authoritative speech
      window.speechSynthesis.speak(utterance);
    },
    [restartListening, selectedVoice, speechRate]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      clearInterval(ttsIntervalRef.current);
      clearTimeout(silenceTimerRef.current);
      clearTimeout(restartTimerRef.current);
      clearTimeout(echoCooldownTimerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return {
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
    restartListening,
  };
}
