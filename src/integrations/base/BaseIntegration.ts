import { IntegrationType } from '@/types';
import { IntegrationConfig, IntegrationContext, IntegrationProcessResult } from '../types';

export abstract class BaseIntegration {
  abstract readonly config: IntegrationConfig;

  /**
   * Process a message with this integration's context
   */
  abstract processMessage(
    message: string, 
    context: IntegrationContext
  ): Promise<IntegrationProcessResult>;

  /**
   * Get the integration's unique identifier
   */
  get id(): IntegrationType {
    return this.config.id;
  }

  /**
   * Get the integration's display name
   */
  get name(): string {
    return this.config.name;
  }

  /**
   * Get the integration's system prompt
   */
  get systemPrompt(): string {
    return this.config.systemPrompt;
  }

  /**
   * Check if the integration is enabled
   */
  get enabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Get the integration's icon component
   */
  get icon(): React.ComponentType<{ className?: string }> {
    return this.config.icon;
  }

  /**
   * Validate if this integration can handle the given message
   * Override this method for custom validation logic
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  canHandle(_message: string, _context: IntegrationContext): boolean {
    return true; // Default: can handle any message when active
  }

  /**
   * Prepare the integration for processing
   * Override this method for setup logic (e.g., API token validation)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async prepare(_context: IntegrationContext): Promise<void> {
    // Default: no preparation needed
  }
}