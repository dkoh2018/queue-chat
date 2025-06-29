export interface Message {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  createdAt: string;
}

export interface UIMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  messages: UIMessage[];
  conversationId?: string | null;
  originalInput?: string;
  optimizedInput?: string;
}

export interface ChatResponse {
  content: string;
  conversationId: string;
}

export interface OptimizationRequest {
  userInput: string;
  conversationHistory?: UIMessage[];
}

export interface OptimizationResponse {
  originalInput: string;
  optimizedInput: string;
  error?: string;
}