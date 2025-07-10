import { supabase } from '@/lib/supabase';

export interface TranscriptionRequest {
  audioBlob: Blob;
  conversationHistory?: Array<{ role: string; content: string }>; // For future context-aware transcription
}

export interface TranscriptionResponse {
  transcription: string;
  metadata: {
    fileSize: number;
    fileType: string;
    processingTime: number;
    timestamp: string;
  };
}

export interface TranscriptionError {
  error: string;
  code?: string;
}

class TranscriptionService {
  private readonly endpoint = '/api/transcribe';

  /**
   * Get auth headers for API requests
   */
  private getAuthHeaders = async (): Promise<HeadersInit> => {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    // Debug logging
    console.log('TranscriptionService - Getting auth headers:', { 
      hasSession: !!session, 
      hasAccessToken: !!session?.access_token,
      error: error?.message 
    });
    
    const headers: HeadersInit = {};

    // Add authorization header if user is authenticated
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    } else {
      console.warn('TranscriptionService - No access token found');
    }

    return headers;
  }

  /**
   * Transcribe audio blob to text using OpenAI Whisper
   */
  async transcribe(request: TranscriptionRequest): Promise<TranscriptionResponse> {
    const { audioBlob, conversationHistory } = request;

    // Validate audio blob
    if (!audioBlob || audioBlob.size === 0) {
      throw new Error('Invalid audio data');
    }

    // Check file size (client-side check)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (audioBlob.size > maxSize) {
      throw new Error(`Audio file too large. Maximum size is ${maxSize / (1024 * 1024)}MB`);
    }

    try {
      // Get authentication headers
      const authHeaders = await this.getAuthHeaders();
      
      // Prepare form data
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      
      // Add conversation history for future context-aware features
      if (conversationHistory && conversationHistory.length > 0) {
        formData.append('history', JSON.stringify(conversationHistory.slice(-5))); // Last 5 messages
      }

      // Make API call with authentication headers
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: authHeaders,
        body: formData,
      });

      // Handle response
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          error: `HTTP ${response.status}: ${response.statusText}` 
        }));
        
        // Handle specific error cases
        if (response.status === 401) {
          // Force sign out to clear invalid session
          await supabase.auth.signOut();
          throw new Error('Session expired - please sign in again');
        }
        
        if (response.status === 429) {
          throw new Error('Too many requests. Please wait a moment before trying again.');
        }
        
        if (response.status === 413) {
          throw new Error('Audio file is too large. Please record a shorter message.');
        }
        
        if (response.status === 400) {
          throw new Error(errorData.error || 'Invalid audio format. Please try recording again.');
        }
        
        if (response.status >= 500) {
          throw new Error('Transcription service is temporarily unavailable. Please try again later.');
        }
        
        throw new Error(errorData.error || `Transcription failed: ${response.status}`);
      }

      const data: TranscriptionResponse = await response.json();
      
      return data;

    } catch (error) {
      // Re-throw with user-friendly message
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error('Failed to transcribe audio. Please check your connection and try again.');
    }
  }

  /**
   * Check if the browser supports audio recording
   */
  static isSupported(): boolean {
    return !!(
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function' &&
      window.MediaRecorder &&
      MediaRecorder.isTypeSupported('audio/webm')
    );
  }

  /**
   * Get supported audio formats for recording
   */
  static getSupportedFormats(): string[] {
    const formats = ['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav'];
    return formats.filter(format =>
      MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(format)
    );
  }

  /**
   * Estimate transcription cost (for display purposes)
   * OpenAI Whisper costs ~$0.006 per minute
   */
  static estimateCost(durationSeconds: number): number {
    const minutes = durationSeconds / 60;
    return minutes * 0.006; // $0.006 per minute
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /**
   * Validate audio blob before transcription
   */
  static validateAudioBlob(blob: Blob): { valid: boolean; error?: string } {
    if (!blob) {
      return { valid: false, error: 'No audio data provided' };
    }

    if (blob.size === 0) {
      return { valid: false, error: 'Audio file is empty' };
    }

    if (blob.size > 5 * 1024 * 1024) {
      return { valid: false, error: 'Audio file is too large (max 5MB)' };
    }

    if (!blob.type.startsWith('audio/')) {
      return { valid: false, error: 'Invalid file type. Must be an audio file.' };
    }

    return { valid: true };
  }
}

// Export singleton instance
export const transcriptionService = new TranscriptionService();
