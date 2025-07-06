import { IntegrationType } from '@/types';
import { BaseIntegration } from './base';
import { MermaidIntegration } from './mermaid';
import { CalendarIntegration } from './calendar';

// Integration registry - add new integrations here
const integrationInstances = {
  mermaid: new MermaidIntegration(),
  calendar: new CalendarIntegration(),
} as const;

export type IntegrationRegistry = typeof integrationInstances;

/**
 * Get a specific integration by type
 */
export function getIntegration(type: IntegrationType): BaseIntegration | null {
  return (integrationInstances as Record<string, BaseIntegration>)[type] || null;
}

/**
 * Get all available integrations
 */
export function getAllIntegrations(): BaseIntegration[] {
  return Object.values(integrationInstances);
}

/**
 * Get all enabled integrations
 */
export function getEnabledIntegrations(): BaseIntegration[] {
  return getAllIntegrations().filter(integration => integration.enabled);
}

/**
 * Get integrations by their IDs
 */
export function getIntegrationsByIds(ids: IntegrationType[]): BaseIntegration[] {
  return ids
    .map(id => getIntegration(id))
    .filter((integration): integration is BaseIntegration => integration !== null);
}

/**
 * Check if an integration exists and is enabled
 */
export function isIntegrationAvailable(type: IntegrationType): boolean {
  const integration = getIntegration(type);
  return integration !== null && integration.enabled;
}

// Re-export types and base classes
export type { IntegrationConfig, IntegrationContext, IntegrationProcessResult } from './types';
export { BaseIntegration } from './base';

// Re-export specific integrations
export { MermaidIntegration } from './mermaid';
export { CalendarIntegration } from './calendar';