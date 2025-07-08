'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/hooks';
import { KeyboardIcon } from '@/components/icons';
import { KeyboardShortcutsModal } from '@/components/ui';

interface ProfileMenuProps {
  className?: string;
  onClearAppData?: () => void;
}

export default function ProfileMenu({ className = '', onClearAppData }: ProfileMenuProps) {
  const { user, loading, signOut } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isKeyboardShortcutsOpen, setIsKeyboardShortcutsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const keyboardModalOpenRef = useRef(false);

  // Keep ref in sync with state
  useEffect(() => {
    keyboardModalOpenRef.current = isKeyboardShortcutsOpen;
  }, [isKeyboardShortcutsOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        // Don't close dropdown if keyboard shortcuts modal is open
        if (!keyboardModalOpenRef.current) {
          setIsDropdownOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAuthClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await signOut(onClearAppData);
      setIsDropdownOpen(false);
    } catch {
    }
  };

  const handleKeyboardShortcuts = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsKeyboardShortcutsOpen(true);
    // Don't close the dropdown - keep it open for easy access
  };

  const handleCloseKeyboardShortcuts = () => {
    setIsKeyboardShortcutsOpen(false);
    // Also close the dropdown when keyboard shortcuts modal is closed
    setIsDropdownOpen(false);
  };

  const getInitials = (name: string): string => {
    const names = name.split(' ').filter(n => n.length > 0);
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getUserDisplayName = () => {
    return user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || user?.email || 'User';
  };

  const getUserInitials = () => {
    if (!user) return 'U';
    const fullName = user.user_metadata?.full_name || user.user_metadata?.name;
    if (fullName) {
      return getInitials(fullName);
    }
    const emailUsername = user.email!.split('@')[0];
    return getInitials(emailUsername);
  };

  if (loading) {
    return (
      <div className={`w-10 h-10 rounded-full glass-button flex items-center justify-center ${className}`}>
        <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={handleAuthClick}
        className={`w-10 h-10 rounded-full glass-button flex items-center justify-center text-white font-semibold text-xs transition-all duration-200 ${isDropdownOpen ? '' : ''} relative overflow-hidden group cursor-pointer`}
        title={`Click for menu (${getUserDisplayName()})`}
      >
        {user.user_metadata?.avatar_url ? (
          <Image
            src={user.user_metadata.avatar_url}
            alt="Profile"
            width={40}
            height={40}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <span className="text-xs font-bold">
            {getUserInitials()}
          </span>
        )}
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-gray-700 rounded-full border border-gray-600 flex items-center justify-center">
          <svg 
            className={`w-2 h-2 text-white transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      {isDropdownOpen && (
        <div className="absolute right-0 w-56 backdrop-blur-md border border-gray-600/50 rounded-lg shadow-xl z-[9999] overflow-hidden pointer-events-auto" style={{ 
          backgroundColor: 'rgba(37, 38, 40, 0.9)',
          bottom: 'calc(100% + 16px)'
        }}>
          <div className="px-4 py-3 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              {user.user_metadata?.avatar_url ? (
                <Image
                  src={user.user_metadata.avatar_url}
                  alt="Profile"
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-xs font-bold">
                  {getUserInitials()}
                </div>
              )}
              <div>
                <div className="text-sm font-medium text-white truncate">{getUserDisplayName()}</div>
                <div className="text-xs text-gray-400 truncate">{user.email}</div>
              </div>
            </div>
          </div>
          <div className="py-2">
            <button
              onClick={handleKeyboardShortcuts}
              className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-200 flex items-center group"
            >
              <KeyboardIcon />
              <span className="ml-3">Keyboard Shortcuts</span>
            </button>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all duration-200 flex items-center group"
            >
              <svg className="w-4 h-4 mr-3 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      )}
      
      <KeyboardShortcutsModal
        isOpen={isKeyboardShortcutsOpen}
        onClose={handleCloseKeyboardShortcuts}
      />
    </div>
  );
} 