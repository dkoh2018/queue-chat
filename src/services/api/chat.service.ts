import { ChatRequest, ChatResponse } from '@/types';
import { API_ENDPOINTS } from '@/utils';
import { supabase } from '@/lib/supabase';

class ChatService {
  /**
   * Get auth headers for API requests
   */
  private getAuthHeaders = async (): Promise<HeadersInit> => {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    // Debug logging
    console.log('ChatService - Getting auth headers:', { 
      hasSession: !!session, 
      hasAccessToken: !!session?.access_token,
      error: error?.message 
    });
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add authorization header if user is authenticated
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    } else {
      console.warn('ChatService - No access token found');
    }

    return headers;
  }

  /**
   * Send chat message and get AI response
   */
  sendMessage = async (request: ChatRequest): Promise<ChatResponse> => {
    const headers = await this.getAuthHeaders();
    const response = await fetch(API_ENDPOINTS.CHAT, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      
      // If unauthorized, it might be a session issue
      if (response.status === 401) {
        console.error('ChatService - Unauthorized error, session might be invalid');
        // Force sign out to clear invalid session
        await supabase.auth.signOut();
        window.location.href = '/login';
        throw new Error('Session expired - please sign in again');
      }
      
      throw new Error(errorData.error || `API Error: ${response.status}`);
    }

    return response.json();
  }
}

// Export singleton instance
export const chatService = new ChatService();