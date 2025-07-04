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
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  requestPermission: () => Promise<boolean>;
  clearError: () => void;
}

const MAX_RECORDING_TIME = 30; // 30 seconds
const AUDIO_CONSTRAINTS = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    sampleRate: 16000, // Optimize for speech
    channelCount: 1, // Mono audio
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

  // Request microphone permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      const stream = await navigator.mediaDevices.getUserMedia(AUDIO_CONSTRAINTS);
      
      // Stop tracks immediately after permission check
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

  // Start recording
  const startRecording = useCallback(async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, error: null }));

      // Check permission first
      if (!state.hasPermission) {
        const hasPermission = await requestPermission();
        if (!hasPermission) return;
      }

      // Get media stream
      const stream = await navigator.mediaDevices.getUserMedia(AUDIO_CONSTRAINTS);
      streamRef.current = stream;

      // Check if MediaRecorder is supported
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        throw new Error('Audio recording is not supported in this browser');
      }

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });
      mediaRecorderRef.current = mediaRecorder;

      // Reset audio chunks
      audioChunksRef.current = [];

      // Handle data available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Handle recording stop
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        handleRecordingComplete(audioBlob);
      };

      // Start recording
      mediaRecorder.start();
      
      setState(prev => ({ 
        ...prev, 
        isRecording: true, 
        timeRemaining: MAX_RECORDING_TIME 
      }));

      // Start countdown timer
      timerRef.current = setInterval(() => {
        setState(prev => {
          const newTimeRemaining = prev.timeRemaining - 1;
          
          // Auto-stop at 0
          if (newTimeRemaining <= 0) {
            stopRecording();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.hasPermission, requestPermission]);

  // Stop recording
  const stopRecording = useCallback((): void => {
    try {
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Stop media recorder
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }

      // Stop media stream
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

  // Handle recording completion
  const handleRecordingComplete = useCallback(async (audioBlob: Blob): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isTranscribing: true }));
      
      // Call your existing transcription service
      const transcriptionResult = await transcriptionService.transcribe({
        audioBlob,
        conversationHistory: [] // You can pass conversation history if needed
      });
      
      setState(prev => ({
        ...prev,
        isTranscribing: false,
        rawTranscription: transcriptionResult.transcription
      }));

      // Clear transcription after a short delay to allow UI to consume it
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

  // Clear error
  const clearError = useCallback((): void => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, [stopRecording]);

  return {
    state,
    startRecording,
    stopRecording,
    requestPermission,
    clearError,
  };
};
