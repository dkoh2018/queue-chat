import { ChatRequest, ChatResponse } from '@/types';
import { API_ENDPOINTS } from '@/utils';
import { supabase } from '@/lib/supabase';

class ChatService {
  /**
   * Get auth headers for API requests
   */
  private getAuthHeaders = async (): Promise<HeadersInit> => {
    const { data: { session } } = await supabase.auth.getSession();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add authorization header if user is authenticated
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
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
      throw new Error(errorData.error || `API Error: ${response.status}`);
    }

    return response.json();
  }
}

// Export singleton instance
export const chatService = new ChatService();