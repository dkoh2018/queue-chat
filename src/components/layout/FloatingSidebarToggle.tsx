import { MenuIcon } from '@/components/icons';

interface FloatingSidebarToggleProps {
  isVisible: boolean;
  onToggle: () => void;
}

export function FloatingSidebarToggle({ isVisible, onToggle }: FloatingSidebarToggleProps) {
  if (!isVisible) return null;

  return (
    <button
      onClick={onToggle}
      className="fixed top-4 left-4 z-30 p-2 backdrop-blur-sm rounded-lg text-white transition-all duration-200"
      style={{
        backgroundColor: 'rgba(37, 38, 40, 0.9)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(37, 38, 40, 1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(37, 38, 40, 0.9)';
      }}
      title="Open sidebar (⌘+\)"
    >
      <MenuIcon />
    </button>
  );
}
