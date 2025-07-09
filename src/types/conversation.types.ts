// Use database types for API responses
export interface Conversation {
  id: string;
  title: string;
  messages: ConversationMessage[];
  createdAt: string;
  updatedAt: string;
}

// Message type specifically for conversation display (normalized from database)
export interface ConversationMessage {
  id: string;
  role: 'USER' | 'ASSISTANT'; // Database format, will be converted to lowercase for UI
  content: string;
  createdAt: string;
}

export interface ConversationCreateRequest {
  title: string;
}

export interface ConversationUpdateRequest {
  title?: string;
}

export interface ConversationDeleteRequest {
  id: string;
}