import { Conversation } from '@/types';
import { API_ENDPOINTS } from '@/utils';
import { supabase } from '@/lib/supabase';

class ConversationsService {
  /**
   * Get auth headers for API requests
   */
  private getAuthHeaders = async (): Promise<HeadersInit> => {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    // Debug logging
    console.log('ConversationsService - Getting auth headers:', { 
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
      console.warn('ConversationsService - No access token found');
    }

    return headers;
  }

  /**
   * Fetch all conversations
   */
  getConversations = async (): Promise<Conversation[]> => {
    const headers = await this.getAuthHeaders();
    const response = await fetch(API_ENDPOINTS.CONVERSATIONS, {
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to fetch conversations' }));
      
      // If unauthorized, it might be a session issue
      if (response.status === 401) {
        console.error('ConversationsService - Unauthorized error, session might be invalid');
        // Force sign out to clear invalid session
        await supabase.auth.signOut();
        window.location.href = '/login';
        throw new Error('Session expired - please sign in again');
      }
      
      throw new Error(errorData.error || `API Error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Delete a conversation
   */
  deleteConversation = async (conversationId: string): Promise<void> => {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_ENDPOINTS.CONVERSATIONS}?id=${conversationId}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to delete conversation' }));
      throw new Error(errorData.error || `API Error: ${response.status}`);
    }
  }
}

// Export singleton instance
export const conversationsService = new ConversationsService();