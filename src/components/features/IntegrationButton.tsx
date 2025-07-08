import { useState, useRef, useEffect } from 'react';
import { IntegrationType, Integration } from '@/types';
import { IntegrationIcon, CheckIcon } from '@/components/icons';
import { CalendarIcon } from '@/integrations/calendar/CalendarIcon';
import { MermaidIcon } from '@/integrations/mermaid/MermaidIcon';
import styles from './IntegrationButton.module.css';

interface IntegrationButtonProps {
  onIntegrationSelect: (type: IntegrationType) => void;
  activeIntegrations: IntegrationType[];
  onBlur?: () => void;
  onPopupStateChange?: (isOpen: boolean) => void;
  onCloseSidebar?: () => void;
  onCloseQueue?: () => void;
}

export const IntegrationButton = ({ onIntegrationSelect, activeIntegrations, onBlur, onPopupStateChange, onCloseSidebar, onCloseQueue }: IntegrationButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (!buttonRef.current || !popupRef.current) return;
      
      const target = event.target as Node;
      
      if (!buttonRef.current.contains(target) && !popupRef.current.contains(target)) {
        event.stopPropagation();
        setIsOpen(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        event.preventDefault();
        event.stopPropagation();
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside, { capture: true });
      document.addEventListener('touchstart', handleClickOutside, { passive: false, capture: true });
      document.addEventListener('keydown', handleEscapeKey, { capture: true });
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside, { capture: true });
        document.removeEventListener('touchstart', handleClickOutside, { capture: true });
        document.removeEventListener('keydown', handleEscapeKey, { capture: true });
      };
    }
  }, [isOpen]);

  useEffect(() => {
    onPopupStateChange?.(isOpen);
  }, [isOpen, onPopupStateChange]);

  return (
    <div
      className={styles.container}
      ref={buttonRef}
    >
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          
          if (!isOpen) {
            onBlur?.();
            onCloseSidebar?.();
            onCloseQueue?.();
          }
          
          setIsOpen(!isOpen);
        }}
        onTouchStart={(e) => {
          e.stopPropagation();
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          e.stopPropagation();
          
          if (!isOpen) {
            onBlur?.();
            onCloseSidebar?.();
            onCloseQueue?.();
          }
          
          setIsOpen(!isOpen);
        }}
        onTouchCancel={(e) => {
          e.stopPropagation();
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
        className={`${styles.button} rounded-full transition-colors flex items-center justify-center ${
          activeIntegrations.length > 0
            ? 'bg-emerald-500/20 text-emerald-400 opacity-100'
            : 'hover:bg-gray-600/50 opacity-70 hover:opacity-100 active:bg-gray-600/70 active:opacity-100'
        }`}
        title="Integrations"
      >
        <IntegrationIcon />
      </button>

      {isOpen && (
        <div
          ref={popupRef}
          className={`${styles.popup} ${styles.popupNormal} ${isOpen ? styles.popupVisible : styles.popupHidden} bg-gray-800 border border-gray-600/80 rounded-md shadow-lg py-2.5 min-w-[160px]`}
          onClick={(e) => {
            e.stopPropagation();
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
          }}
          onTouchEnd={(e) => {
            e.stopPropagation();
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
        >
          {integrations.map((integration) => {
            const IconComponent = integration.icon;
            const isActive = activeIntegrations.includes(integration.id);
            
            return (
              <button
                key={integration.id}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onIntegrationSelect(integration.id);
                }}
                onTouchStart={(e) => {
                  e.stopPropagation();
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onIntegrationSelect(integration.id);
                }}
                onTouchCancel={(e) => {
                  e.stopPropagation();
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                }}
                onMouseUp={(e) => {
                  e.stopPropagation();
                }}
                className={`${styles.option} w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center space-x-3 ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'text-gray-300 hover:bg-gray-700/50 active:bg-gray-600/70 active:text-gray-200'
                }`}
              >
                <div className="w-4 h-4 flex-shrink-0 flex items-center justify-center">
                  <IconComponent />
                </div>
                <span className="font-medium">{integration.name}</span>
                {isActive && (
                  <div className="ml-auto text-emerald-400">
                    <CheckIcon className="w-3.5 h-3.5" />
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