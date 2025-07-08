# Queue Chat - User Guide & Developer Instructions

This is an intelligent chat application that revolutionizes how you interact with AI by introducing a **message queue system** and **smart prompt optimization**. Instead of traditional back-and-forth conversations, you can batch multiple questions and get better, more contextual responses.

## What This App Does (User Features)

### 🎯 **Smart Message Queue System**
- **Queue Multiple Questions**: Instead of asking one question at a time, you can add multiple related questions to a queue
- **Batch Processing**: The AI processes all your queued messages together, giving it full context of what you're trying to accomplish
- **Reorder Questions**: Drag and drop to reorganize your queue before processing (though currently set to sequential-only mode)
- **Real-time Status**: See which message is currently being processed with visual indicators
- **Queue Management**: Remove questions from the queue if you change your mind

### 🧠 **Two-Stage AI Optimization**
- **Automatic Prompt Enhancement**: Your input is first optimized by an AI to make it clearer and more detailed
- **Better Responses**: The enhanced prompt is then sent to the main AI, resulting in more accurate and comprehensive answers
- **Manual Optimization**: Press `Cmd+E` (Mac) or `Ctrl+E` (Windows) to manually optimize your current input before sending

### 🎤 **Voice Input with Transcription**
- **Voice Recording**: Click the microphone button to record voice messages (30-second limit)
- **Multiple Recordings**: Record multiple voice clips and append them together
- **Auto-Transcription**: Uses OpenAI's transcription service to convert speech to text
- **Smart Processing**: Voice transcriptions are automatically fed through the prompt optimization pipeline

### 📊 **AI-Powered Diagram Generation**
- **Mermaid Integration**: Request flowcharts, sequence diagrams, mind maps, and other visual diagrams
- **Smart Detection**: The app automatically detects when you want a diagram and uses specialized prompts
- **Interactive Diagrams**: Generated diagrams are fully interactive with zoom and pan controls
- **Copy Functionality**: Easily copy diagram code for use elsewhere

### 💬 **Enhanced Chat Experience**
- **Conversation History**: All your chats are automatically saved and organized in the sidebar
- **Search Conversations**: Find previous conversations quickly with the search function
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Dark Theme**: Modern dark interface that's easy on the eyes
- **Markdown Support**: Rich text formatting, code blocks, tables, and more in responses

### 🔧 **Smart Interface Features**
- **Floating Menu**: Access the sidebar from anywhere with the floating menu button
- **Auto-Resize**: Message input automatically expands as you type longer messages
- **Keyboard Shortcuts**:
  - `Enter` to send message
  - `Shift+Enter` for new line
  - `Cmd/Ctrl+E` to optimize input
- **Mobile Optimized**: Special mobile layout with proper keyboard handling and viewport adjustments

## Development Commands & Setup

### Core NPM Commands
* `npm run dev` – Start development server with hot reload (uses Turbopack for faster builds)
* `npm run build` – Create production build
* `npm run start` – Run the compiled production app
* `npm run lint` – Check code quality with ESLint

### Database Management (Prisma)
* `npm run db:generate` – Generate TypeScript client from database schema
* `npm run db:push` – Push schema changes to database (for development)
* `npm run db:migrate` – Create and run database migrations (for production)
* `npm run db:reset` – Reset database and run all migrations from scratch
* `npm run db:studio` – Open Prisma Studio database browser at `http://localhost:5555`

## Technical Architecture Overview

### Frontend Framework
- **Next.js 15** with App Router for modern React development
- **TypeScript** for type safety and better developer experience
- **React 19** with latest features and optimizations
- **Tailwind CSS 4** for utility-first styling with custom glass morphism effects

### Database & Backend
- **PostgreSQL** database for reliable data persistence
- **Prisma ORM** for type-safe database operations
- **Supabase** for authentication and session management
- **OpenAI API** integration for chat completions and transcription services

### Key Components Structure
```
src/
├── app/                 # Next.js App Router pages and API routes
├── components/          # Reusable UI components
│   ├── chat/           # Chat interface, message bubbles, input
│   ├── features/       # Feature-specific components (voice, queue, etc.)
│   ├── layout/         # Layout components (sidebar, headers)
│   └── ui/             # Basic UI elements (buttons, icons, etc.)
├── hooks/              # Custom React hooks for state management
├── integrations/       # External service integrations (Mermaid, etc.)
├── services/           # Server-side business logic
├── lib/                # Shared utilities and configurations
└── types/              # TypeScript type definitions
```

### Database Schema (Prisma)
The app uses four main database tables:
- **User**: Stores user authentication and profile information
- **Conversation**: Each chat session with title and metadata
- **Message**: Individual messages within conversations (user/assistant)
- **UserOAuthToken**: OAuth tokens for external service integrations

## User Interface Design Principles

### Visual Design
- **Glass Morphism**: Modern frosted glass effects with backdrop blur
- **Dark Theme**: Primary background `#161618` (RGB: 22, 22, 24) for comfortable viewing
- **Rounded Corners**: Consistent 20px border-radius for message input and 12px for floating elements
- **Smooth Animations**: OpenAI-style transitions for professional feel
- **Responsive Layout**: Mobile-first design with proper viewport handling

### User Experience Patterns
- **Progressive Disclosure**: Features appear when needed (queue, voice controls, etc.)
- **Contextual Actions**: Right-click menus, hover states, and keyboard shortcuts
- **Visual Feedback**: Loading states, success indicators, and error messages
- **Accessibility**: Proper focus management, ARIA labels, and keyboard navigation

### Mobile Considerations
- **Viewport Units**: Uses `100dvh` instead of `100vh` to handle mobile browser address bars
- **Touch Optimization**: Proper touch targets and gesture handling
- **Keyboard Handling**: Smart input focus and virtual keyboard management
- **Performance**: Hardware acceleration and optimized animations

## Code Quality & Development Standards

### TypeScript Configuration
- **Strict Mode**: `strict: true` with no implicit `any` types
- **Path Aliases**: `@/*` resolves to `src/*` for clean imports
- **Type Safety**: All components, hooks, and utilities are fully typed

### Code Organization
- **Component Structure**: Functional components with hooks, no class components
- **File Naming**:
  - React components: `PascalCase.tsx`
  - Hooks: `useX.ts`
  - Utilities: `camelCase.ts`
  - Types: `PascalCase` interfaces and types
- **Import Order**: External libraries → internal modules → relative imports

### Styling Guidelines
- **Tailwind CSS 4**: Utility-first approach with custom CSS modules for complex components
- **Class Organization**: Layout → spacing → typography → colors → states
- **Custom Styles**: Component-specific styles in `.module.css` files
- **Responsive Design**: Mobile-first breakpoints with `sm:`, `md:`, `lg:`, `xl:` prefixes

### Error Handling Strategy
- **Graceful Degradation**: App continues working even if features fail
- **User-Friendly Messages**: Clear error messages without technical jargon
- **Logging**: Console errors for debugging, user-facing messages for UX
- **Recovery**: Automatic retries for network issues, manual retry options

## Environment Configuration

### Required Environment Variables
```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"

# OpenAI API
OPENAI_API_KEY="sk-..."

# Supabase Authentication
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."

# Optional: Additional service integrations
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Development vs Production
- **Development**: Uses local PostgreSQL, hot reload, detailed error messages
- **Production**: Optimized builds, error boundaries, performance monitoring
- **Environment Detection**: Automatic configuration based on `NODE_ENV`

## Feature Implementation Details

### Message Queue System
- **State Management**: React hooks with optimistic updates
- **Queue Processing**: Sequential processing with visual progress indicators
- **Persistence**: Queue state is temporarily stored in memory (not persisted across sessions)
- **User Controls**: Add, remove, reorder (drag-and-drop ready but currently sequential-only)

### Voice Recording Integration
- **Recording Limits**: 30-second maximum per recording with visual countdown
- **Multiple Clips**: Users can record and append multiple voice segments
- **Transcription**: OpenAI Whisper API for speech-to-text conversion
- **Error Handling**: Graceful fallback if microphone access is denied

### AI Prompt Optimization
- **Two-Stage Process**: Input optimization → enhanced prompt → final response
- **Manual Trigger**: `Cmd+E` / `Ctrl+E` keyboard shortcut for manual optimization
- **Automatic Enhancement**: Voice inputs are automatically optimized
- **Context Preservation**: Original intent is maintained while improving clarity

### Diagram Generation
- **Mermaid.js Integration**: Supports flowcharts, sequence diagrams, mind maps, etc.
- **Smart Detection**: AI recognizes diagram requests and applies specialized prompts
- **Interactive Rendering**: Pan, zoom, and copy functionality
- **Fallback Handling**: Graceful degradation if diagram rendering fails

## Testing & Quality Assurance

### Current Testing Status
- **No automated tests yet**: Framework is ready for Vitest or Jest integration
- **Manual Testing**: Comprehensive manual testing across devices and browsers
- **Type Safety**: TypeScript provides compile-time error detection
- **Linting**: ESLint with Next.js rules for code quality

### Recommended Testing Strategy
- **Unit Tests**: Component logic, utility functions, hooks
- **Integration Tests**: API endpoints, database operations
- **E2E Tests**: User workflows, cross-browser compatibility
- **Performance Tests**: Load times, memory usage, mobile performance

---

## Future Enhancement Opportunities

### Planned Features
- **File Attachments**: Upload and process documents, images
- **Advanced Queue Management**: Drag-and-drop reordering, queue templates
- **Integration Ecosystem**: Calendar, email, project management tools
- **Collaboration**: Shared conversations, team workspaces
- **Advanced Voice**: Real-time transcription, voice commands

### Technical Improvements
- **Caching Strategy**: Redis for session management, response caching
- **Real-time Updates**: WebSocket integration for live collaboration
- **Performance Optimization**: Code splitting, lazy loading, CDN integration
- **Security Enhancements**: Rate limiting, input sanitization, audit logging

---
*This guide serves as both user documentation and developer reference. Update sections as new features are added or existing functionality changes.*
