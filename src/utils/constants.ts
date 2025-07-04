// API Endpoints
export const API_ENDPOINTS = {
  CHAT: '/api/chat',
  CONVERSATIONS: '/api/conversations',
  OPTIMIZE_INPUT: '/api/optimize-input',
  TRANSCRIBE: '/api/transcribe',
} as const;

// UI Constants
export const UI_CONSTANTS = {
  MAX_MESSAGE_LENGTH: 4000,
  MAX_CONVERSATION_TITLE_LENGTH: 50,
  CONVERSATION_HISTORY_LIMIT: 20,
  SIDEBAR_WIDTH: 256, // w-64 in pixels
  TYPING_INDICATOR_DELAY: 500,
  COPY_SUCCESS_DURATION: 2000,
} as const;

// Default Messages
export const DEFAULT_MESSAGES = {
  WELCOME: "How can I help, David?",
  LOADING_CONVERSATIONS: "Loading conversations...",
  NO_CONVERSATIONS: "No conversations yet",
  OPTIMIZATION_LOADING: "Optimizing input...",
  GENERIC_ERROR: "Something went wrong. Please try again.",
  NETWORK_ERROR: "Network error. Please check your connection.",
  COPY_SUCCESS: "✓ Copied!",
  COPY_DEFAULT: "Copy",
} as const;

// Animation Durations (in ms)
export const ANIMATIONS = {
  SIDEBAR_TRANSITION: 300,
  MODAL_TRANSITION: 200,
  BUTTON_HOVER: 150,
  TOAST_DURATION: 3000,
} as const;

// Breakpoints (matching Tailwind CSS)
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
} as const;