import { IntegrationType } from '@/types';

export interface IntegrationConfig {
  id: IntegrationType;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  systemPrompt: string;
  enabled: boolean;
}

export interface IntegrationContext {
  userId?: string;
  conversationId?: string;
  messageHistory?: Array<{ role: string; content: string }>;
  [key: string]: unknown;
}

export interface IntegrationProcessResult {
  systemPrompt: string;
  modifiedInput?: string;
  context?: Record<string, unknown>;
  requiresSpecialHandling?: boolean;
}

export interface IntegrationApiHandler {
  (context: IntegrationContext): Promise<IntegrationProcessResult>;
}