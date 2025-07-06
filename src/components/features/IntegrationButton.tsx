import { useState, useRef, useEffect } from 'react';
import { IntegrationType, Integration } from '@/types';
import { CalendarIcon, MermaidIcon, IntegrationIcon, CheckIcon } from '@/components/icons';
import styles from './IntegrationButton.module.css';

interface IntegrationButtonProps {
  onIntegrationSelect: (type: IntegrationType) => void;
  activeIntegrations: IntegrationType[];
  onBlur?: () => void;
  onPopupStateChange?: (isOpen: boolean) => void;
}

export const IntegrationButton = ({ onIntegrationSelect, activeIntegrations, onBlur, onPopupStateChange }: IntegrationButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isTouching, setIsTouching] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [touchingOption, setTouchingOption] = useState<string | null>(null);
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

  // Step 9: Event Propagation - Enhanced outside click handling with proper propagation control
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      // Prevent event propagation issues
      if (!buttonRef.current || !popupRef.current) return;
      
      const target = event.target as Node;
      
      // Check if click/touch is outside both button and popup
      if (!buttonRef.current.contains(target) && !popupRef.current.contains(target)) {
        // Stop propagation to prevent interference with other components
        event.stopPropagation();
        setIsOpen(false);
        setIsTouching(false);
        setTouchingOption(null);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      // Handle escape key for accessibility
      if (event.key === 'Escape' && isOpen) {
        event.preventDefault();
        event.stopPropagation();
        setIsOpen(false);
        setIsTouching(false);
        setTouchingOption(null);
      }
    };

    if (isOpen) {
      // Add event listeners with proper options for mobile
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



  // Handle popup state changes with animation
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      // Start animation immediately, no delay
      requestAnimationFrame(() => {
        setIsAnimating(false);
      });
    }
  }, [isOpen]);

  // Cleanup states when popup closes
  useEffect(() => {
    if (!isOpen) {
      setIsTouching(false);
      setIsAnimating(false);
      setTouchingOption(null);
    }
  }, [isOpen]);

  // Notify parent component when popup state changes
  useEffect(() => {
    onPopupStateChange?.(isOpen);
  }, [isOpen, onPopupStateChange]);

  return (
    <div
      className={styles.container}
      ref={buttonRef}
    >
      {/* Main Integration Button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          
          // Turn off text input when opening popup
          if (!isOpen) {
            onBlur?.();
          }
          
          setIsOpen(!isOpen);
        }}
        onTouchStart={(e) => {
          // Prevent propagation for touch events
          e.stopPropagation();
          setIsTouching(true);
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsTouching(false);
          
          // Turn off text input when opening popup on touch
          if (!isOpen) {
            onBlur?.();
          }
          
          setIsOpen(!isOpen);
        }}
        onTouchCancel={(e) => {
          e.stopPropagation();
          setIsTouching(false);
        }}
        onMouseDown={(e) => {
          // Prevent mouse event propagation
          e.stopPropagation();
        }}
        className={`${styles.button} rounded-full transition-colors flex items-center justify-center ${
          activeIntegrations.length > 0
            ? 'bg-emerald-500/20 text-emerald-400 opacity-100'
            : isTouching
            ? 'bg-gray-600/70 opacity-100'
            : 'hover:bg-gray-600/50 opacity-70 hover:opacity-100'
        } ${isAnimating ? styles.buttonAnimating : ''}`}
        title="Integrations"
      >
        <IntegrationIcon />
      </button>

      {/* Integration Options Popup */}
      {isOpen && (
        <div
          ref={popupRef}
          className={`${styles.popup} ${
            isAnimating ? styles.popupAnimating : styles.popupNormal
          } ${isOpen ? styles.popupVisible : styles.popupHidden} bg-gray-800 border border-gray-600/80 rounded-md shadow-lg py-2.5 min-w-[160px]`}
          onClick={(e) => {
            // Step 9: Prevent popup clicks from propagating
            e.stopPropagation();
          }}
          onTouchStart={(e) => {
            // Prevent touch events on popup from propagating
            e.stopPropagation();
          }}
          onTouchEnd={(e) => {
            // Prevent touch end events from propagating
            e.stopPropagation();
          }}
          onMouseDown={(e) => {
            // Prevent mouse events from propagating
            e.stopPropagation();
          }}
        >
          {/* Integration Options */}
          {integrations.map((integration) => {
            const IconComponent = integration.icon;
            const isActive = activeIntegrations.includes(integration.id);
            
            return (
              <button
                key={integration.id}
                onClick={(e) => {
                  // Step 9: Event Propagation - Prevent bubbling for option buttons
                  e.preventDefault();
                  e.stopPropagation();
                  
                  // Toggle the integration using the toggle function
                  onIntegrationSelect(integration.id);
                  // Don't close the dropdown - keep it open for multiple selections
                }}
                onTouchStart={(e) => {
                  e.stopPropagation();
                  setTouchingOption(integration.id);
                }}
                onTouchEnd={(e) => {
                  // Step 9: Comprehensive touch event propagation control
                  e.preventDefault();
                  e.stopPropagation();
                  setTouchingOption(null);
                  onIntegrationSelect(integration.id);
                }}
                onTouchCancel={(e) => {
                  e.stopPropagation();
                  setTouchingOption(null);
                }}
                onMouseDown={(e) => {
                  // Prevent mouse event propagation for option buttons
                  e.stopPropagation();
                }}
                onMouseUp={(e) => {
                  // Prevent mouse up propagation
                  e.stopPropagation();
                }}
                className={`${styles.option} w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center space-x-3 ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : touchingOption === integration.id
                    ? 'bg-gray-600/70 text-gray-200'
                    : 'text-gray-300 hover:bg-gray-700/50'
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