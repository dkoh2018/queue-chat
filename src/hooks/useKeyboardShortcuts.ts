import { useEffect } from 'react';

interface UseKeyboardShortcutsParams {
  handleNewChat: () => void;
  setSidebarOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  deleteModalOpen: boolean;
  handleCancelDelete: () => void;
}

export const useKeyboardShortcuts = ({
  handleNewChat,
  setSidebarOpen,
  deleteModalOpen,
  handleCancelDelete,
}: UseKeyboardShortcutsParams) => {
  // Keyboard shortcuts (Cmd+K for new chat, Cmd+\ for sidebar toggle)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        handleNewChat();
      }
      if ((event.metaKey || event.ctrlKey) && event.key === '\\') {
        event.preventDefault();
        setSidebarOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleNewChat, setSidebarOpen]);

  // Keyboard shortcut for Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (deleteModalOpen) {
          handleCancelDelete();
        } else {
          const textarea = document.querySelector('textarea[placeholder="Ask anything"]') as HTMLTextAreaElement;
          if (document.activeElement === textarea) {
            textarea.blur();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [deleteModalOpen, handleCancelDelete]);
};
