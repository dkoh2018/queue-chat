import { BaseIntegration } from '../base';
import { IntegrationConfig, IntegrationContext, IntegrationProcessResult } from '../types';
import { MermaidIcon } from './MermaidIcon';
import { MERMAID_EXPERT_PROMPT } from '@/lib/prompts/mermaid';

export class MermaidIntegration extends BaseIntegration {
  readonly config: IntegrationConfig = {
    id: 'mermaid',
    name: 'Mermaid Diagrams',
    description: 'Generate flowcharts, sequence diagrams, and other visual diagrams using Mermaid syntax',
    icon: MermaidIcon,
    systemPrompt: MERMAID_EXPERT_PROMPT,
    enabled: true,
  };

  async processMessage(
    message: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _context: IntegrationContext
  ): Promise<IntegrationProcessResult> {
    // For Mermaid, we simply attach the expert prompt
    // The AI will automatically generate diagrams when appropriate
    return {
      systemPrompt: this.config.systemPrompt,
      modifiedInput: message, // Keep original message
      context: {
        integrationId: this.config.id,
        diagramRequest: true,
      },
      requiresSpecialHandling: false,
    };
  }

  // Override canHandle to detect diagram-related keywords
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  canHandle(message: string, _context: IntegrationContext): boolean {
    const diagramKeywords = [
      'diagram', 'flowchart', 'sequence', 'chart', 'flow',
      'process', 'workflow', 'visualize', 'graph', 'mermaid',
      'steps', 'architecture', 'relationship', 'structure'
    ];
    
    const lowerMessage = message.toLowerCase();
    return diagramKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  // Override prepare for any Mermaid-specific setup
  async prepare(): Promise<void> {
    // No special preparation needed for Mermaid
    // Could add validation logic here if needed
  }
}