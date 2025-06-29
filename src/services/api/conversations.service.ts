import { Conversation } from '@/types';
import { API_ENDPOINTS } from '@/utils';

class ConversationsService {
  /**
   * Fetch all conversations
   */
  async getConversations(): Promise<Conversation[]> {
    const response = await fetch(API_ENDPOINTS.CONVERSATIONS);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to fetch conversations' }));
      throw new Error(errorData.error || `API Error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(conversationId: string): Promise<void> {
    const response = await fetch(`${API_ENDPOINTS.CONVERSATIONS}?id=${conversationId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to delete conversation' }));
      throw new Error(errorData.error || `API Error: ${response.status}`);
    }
  }
}

// Export singleton instance
export const conversationsService = new ConversationsService();