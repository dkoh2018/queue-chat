import { Message } from './chat.types';

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
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