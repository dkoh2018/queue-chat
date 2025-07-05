import { useState, useRef, useEffect } from 'react';
import { IntegrationType, Integration } from '@/types';
import { CalendarIcon, MermaidIcon, IntegrationIcon, CheckIcon } from '@/components/icons';

interface IntegrationButtonProps {
  onIntegrationSelect: (type: IntegrationType) => void;
  activeIntegrations: IntegrationType[];
}

export const IntegrationButton = ({ onIntegrationSelect, activeIntegrations }: IntegrationButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);

  const integrations: Integration[] = [
    {
      id: 'calendar',
      name: 'Calendar',
      icon: CalendarIcon,
      description: ''
    },
    {
      id: 'mermaid',
      name: 'Mermaid',
      icon: MermaidIcon,
      description: ''
    }
  ];

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={buttonRef}>
      {/* Main Integration Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`rounded-full transition-colors p-1.5 ${
          activeIntegrations.length > 0
            ? 'bg-emerald-500/20 text-emerald-400 opacity-100'
            : 'hover:bg-gray-600/50 opacity-70 hover:opacity-100'
        }`}
        title="Integrations"
      >
        <IntegrationIcon />
      </button>

      {/* Integration Options Popup */}
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 bg-gray-800/95 backdrop-blur-sm border border-gray-600/50 rounded-md shadow-lg py-2 min-w-[140px] z-50">
          {/* Integration Options */}
          {integrations.map((integration) => {
            const IconComponent = integration.icon;
            const isActive = activeIntegrations.includes(integration.id);
            
            return (
              <button
                key={integration.id}
                onClick={() => {
                  // Toggle the integration using the toggle function
                  onIntegrationSelect(integration.id);
                  // Don't close the dropdown - keep it open for multiple selections
                }}
                className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center space-x-2.5 ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'text-gray-300 hover:bg-gray-700/50'
                }`}
              >
                <div className="w-3.5 h-3.5 flex-shrink-0 flex items-center justify-center">
                  <IconComponent />
                </div>
                <span className="font-medium">{integration.name}</span>
                {isActive && (
                  <div className="ml-auto text-emerald-400">
                    <CheckIcon className="w-3 h-3" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};