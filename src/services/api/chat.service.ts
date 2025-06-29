import { ChatRequest, ChatResponse } from '@/types';
import { API_ENDPOINTS } from '@/utils';

class ChatService {
  /**
   * Send chat message and get AI response
   */
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    const response = await fetch(API_ENDPOINTS.CHAT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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