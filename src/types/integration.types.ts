import { ComponentType } from 'react';

export type IntegrationType = 'calendar' | 'mermaid';

export interface Integration {
  id: IntegrationType;
  name: string;
  icon: ComponentType;
  description: string;
  isActive?: boolean;
}