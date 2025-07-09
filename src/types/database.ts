// Database table types matching your Supabase schema

export interface User {
  id: string; // UUID
  email: string;
  name: string | null;
  avatar_url: string | null;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface UserOAuthToken {
  id: string;
  user_id: string; // UUID
  provider: string; // 'google', 'github', etc.
  provider_token: string;
  provider_refresh_token: string | null;
  token_expires_at: string | null; // ISO timestamp
  scopes: string[];
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface Conversation {
  id: string;
  title: string;
  user_id: string; // UUID
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface Message {
  id: string;
  role: string; // 'USER' | 'ASSISTANT'
  content: string;
  conversation_id: string;
  created_at: string; // ISO timestamp
}

// API request/response types
export interface ChatRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  conversationId?: string;
  originalInput?: string;
  optimizedInput?: string;
  isDiagramRequest?: boolean;
  isCalendarRequest?: boolean;
  activeIntegrations?: string[];
  providerToken?: string;
}



// Database operations types
export interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

export interface CreateConversationData {
  id: string;
  title: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateMessageData {
  role: string;
  content: string;
  conversation_id: string;
}
