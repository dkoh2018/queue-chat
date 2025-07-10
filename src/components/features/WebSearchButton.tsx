import { GlobeIcon } from '@/components/icons';
import styles from '../chat/MessageInput.module.css';

interface WebSearchButtonProps {
  onClick: () => void;
  isActive?: boolean;
  onBlur?: () => void;
}

export const WebSearchButton = ({ 
  onClick, 
  isActive = false,
  onBlur 
}: WebSearchButtonProps) => {
  return (
    <button
      onClick={onClick}
      onBlur={onBlur}
      className={`${styles.attachButton} ${styles.noPadding} ${styles.webSearchButton}`}
      title="Web Search"
      style={{
        opacity: 1,
        backgroundColor: isActive ? 'rgba(52, 211, 153, 0.15)' : 'transparent',
        border: isActive ? '1px solid rgba(52, 211, 153, 0.4)' : '1px solid transparent',
        borderRadius: '8px',
        boxShadow: isActive ? '0 0 12px rgba(52, 211, 153, 0.3), inset 0 1px 0 rgba(52, 211, 153, 0.2)' : 'none',
        position: 'relative',
        transition: 'all 0.2s ease'
      }}
    >
      <div style={{
        color: isActive ? 'rgb(52, 211, 153)' : 'rgb(156, 163, 175)', // Use gray-400 like other icons
        transition: 'color 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <GlobeIcon />
      </div>
      {isActive && (
        <div style={{
          position: 'absolute',
          inset: '-1px',
          borderRadius: '8px',
          background: 'linear-gradient(45deg, rgba(52, 211, 153, 0.1), rgba(52, 211, 153, 0.05))',
          pointerEvents: 'none',
          animation: 'pulse 2s ease-in-out infinite'
        }} />
      )}
    </button>
  );
}; 