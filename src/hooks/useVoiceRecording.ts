import { useState, useRef, useCallback, useEffect } from 'react';
import { transcriptionService } from '@/services';

export interface VoiceRecordingState {
  isRecording: boolean;
  isTranscribing: boolean;
  isOptimizing: boolean;
  timeRemaining: number;
  hasPermission: boolean;
  error: string | null;
  rawTranscription?: string;
  optimizedText?: string;
}

interface UseVoiceRecordingReturn {
  state: VoiceRecordingState;
  mediaStream: MediaStream | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  requestPermission: () => Promise<boolean>;
  clearError: () => void;
}

const MAX_RECORDING_TIME = 30;
const AUDIO_CONSTRAINTS = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    sampleRate: 16000,
    channelCount: 1,
  }
};

export const useVoiceRecording = (): UseVoiceRecordingReturn => {
  const [state, setState] = useState<VoiceRecordingState>({
    isRecording: false,
    isTranscribing: false,
    isOptimizing: false,
    timeRemaining: MAX_RECORDING_TIME,
    hasPermission: false,
    error: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const stopRecordingRef = useRef<(() => void) | null>(null);
  const handleRecordingCompleteRef = useRef<((audioBlob: Blob) => Promise<void>) | null>(null);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      const stream = await navigator.mediaDevices.getUserMedia(AUDIO_CONSTRAINTS);
      
      stream.getTracks().forEach(track => track.stop());
      
      setState(prev => ({ ...prev, hasPermission: true }));
      return true;
    } catch {
      setState(prev => ({
        ...prev, 
        hasPermission: false,
        error: 'Microphone permission is required for voice input. Please allow access and try again.'
      }));
      return false;
    }
  }, []);

  const startRecording = useCallback(async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, error: null }));

      if (!state.hasPermission) {
        const hasPermission = await requestPermission();
        if (!hasPermission) return;
      }

      const stream = await navigator.mediaDevices.getUserMedia(AUDIO_CONSTRAINTS);
      streamRef.current = stream;

      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        throw new Error('Audio recording is not supported in this browser');
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });
      mediaRecorderRef.current = mediaRecorder;

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        handleRecordingCompleteRef.current?.(audioBlob);
      };

      mediaRecorder.start();
      
      setState(prev => ({ 
        ...prev, 
        isRecording: true, 
        timeRemaining: MAX_RECORDING_TIME 
      }));

      timerRef.current = setInterval(() => {
        setState(prev => {
          const newTimeRemaining = prev.timeRemaining - 1;
          
          if (newTimeRemaining <= 0) {
            stopRecordingRef.current?.();
            return { ...prev, timeRemaining: 0 };
          }
          
          return { ...prev, timeRemaining: newTimeRemaining };
        });
      }, 1000);

    } catch {
      setState(prev => ({
        ...prev,
        isRecording: false,
        error: 'Failed to start recording'
      }));
    }
  }, [state.hasPermission, requestPermission]);

  const stopRecording = useCallback((): void => {
    try {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      setState(prev => ({ ...prev, isRecording: false }));
    } catch {
      setState(prev => ({
        ...prev, 
        isRecording: false,
        error: 'Failed to stop recording'
      }));
    }
  }, []);

  const handleRecordingComplete = useCallback(async (audioBlob: Blob): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isTranscribing: true }));
      
      const transcriptionResult = await transcriptionService.transcribe({
        audioBlob,
        conversationHistory: []
      });
      
      setState(prev => ({
        ...prev,
        isTranscribing: false,
        rawTranscription: transcriptionResult.transcription
      }));

      setTimeout(() => {
        setState(prev => ({
          ...prev,
          rawTranscription: undefined
        }));
      }, 100);

    } catch {
      setState(prev => ({
        ...prev,
        isTranscribing: false,
        error: 'Failed to process recording'
      }));
    }
  }, []);

  const clearError = useCallback((): void => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Assign functions to refs to avoid circular dependencies
  stopRecordingRef.current = stopRecording;
  handleRecordingCompleteRef.current = handleRecordingComplete;

  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, [stopRecording]);

  return {
    state,
    mediaStream: streamRef.current,
    startRecording,
    stopRecording,
    requestPermission,
    clearError,
  };
};
