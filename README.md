# 🤖 Jarvis Chat - AI-Powered Developer Assistant

A sophisticated, modern chat application built with Next.js 15, featuring intelligent input optimization, real-time conversations, and a professional developer-focused interface with syntax-highlighted code blocks.

## 🎯 Overview

Jarvis Chat is a ChatGPT-like interface specifically designed for developers, featuring:

- **🧠 Intelligent Input Optimization** - AI automatically enhances user input for better responses
- **💬 Real-time Chat Interface** - Seamless conversation experience with typing indicators
- **🎨 Syntax-Highlighted Code Blocks** - Professional code rendering with copy functionality
- **📚 Persistent Conversation History** - PostgreSQL-backed conversation storage
- **📱 Fully Responsive Design** - Works perfectly on desktop, tablet, and mobile
- **⚡ Modern Architecture** - FAANG-level code organization and practices

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- **Next.js 15** - React framework with App Router
- **React 19** - Latest React with concurrent features
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **React Markdown** - Markdown rendering
- **Prism React Renderer** - Syntax highlighting

**Backend:**
- **Next.js API Routes** - Serverless API endpoints
- **Prisma ORM** - Type-safe database access
- **PostgreSQL** - Robust relational database
- **OpenAI API** - GPT-4o-mini for chat and optimization

**Development:**
- **ESLint** - Code linting
- **Professional Architecture** - FAANG-level organization

### Project Structure

```
src/
├── app/                     # Next.js App Router
│   ├── layout.tsx          # Root layout with theme provider
│   ├── page.tsx            # Main chat interface
│   └── api/                # API endpoints
│       ├── chat/           # Chat completion endpoint
│       ├── conversations/  # Conversation CRUD operations
│       └── optimize-input/ # Input optimization endpoint
│
├── components/             # Reusable UI components
│   ├── ui/                # Base components (Button, Modal, etc.)
│   ├── chat/              # Chat-specific components
│   ├── sidebar/           # Sidebar components
│   ├── markdown/          # Markdown rendering
│   │   ├── MarkdownMessage.tsx
│   │   └── CodeBlock.tsx
│   └── modals/            # Modal components
│
├── hooks/                 # Custom React hooks
│   ├── useConversations.ts # Conversation management
│   ├── useChat.ts         # Chat functionality
│   └── index.ts
│
├── services/              # External service integrations
│   ├── api/               # API service layer
│   │   ├── chat.service.ts
│   │   ├── conversations.service.ts
│   │   └── optimization.service.ts
│   └── index.ts
│
├── types/                 # TypeScript definitions
│   ├── chat.types.ts      # Chat-related types
│   ├── conversation.types.ts
│   ├── ui.types.ts
│   └── index.ts
│
├── utils/                 # Utility functions
│   ├── constants.ts       # App constants
│   ├── helpers.ts         # Helper functions
│   └── index.ts
│
└── lib/                   # External library configs
    └── db.ts             # Prisma database client
```

## 🚀 Features

### 🧠 Intelligent Input Optimization

The app features a unique **two-stage AI processing system**:

1. **Input Optimization Stage**: Before sending to the main AI, user input is enhanced using conversation context
2. **Response Generation Stage**: The optimized input generates higher-quality responses

**Flow:**
```
User Input → Optimization AI → Enhanced Input → Main AI → Response
```

**Benefits:**
- More detailed and contextual responses
- Better understanding of user intent
- Improved conversation flow

### 💬 Chat Interface

**Core Features:**
- Real-time message exchange
- Typing indicators during AI processing
- Message persistence across sessions
- Optimistic UI updates for better UX

**Message Types:**
- **User Messages**: Original user input (displayed as-is)
- **Assistant Messages**: AI responses with markdown rendering
- **Code Blocks**: Syntax-highlighted with copy functionality
- **Inline Code**: Subtle highlighting for variables and functions

### 🎨 Developer-Focused UI

**Code Rendering:**
- **Triple Backticks** (```): Full code blocks with syntax highlighting
- **Single Backticks** (`): Inline code with monospace font
- **Copy Functionality**: One-click code copying
- **Language Detection**: Automatic syntax highlighting for 20+ languages

**Supported Languages:**
JavaScript, Python, TypeScript, HTML, CSS, JSON, SQL, Bash, and more

### 📚 Conversation Management

**Features:**
- **Persistent Storage**: Conversations saved to PostgreSQL
- **Smart Titles**: Auto-generated from first message
- **Delete Functionality**: With confirmation modal
- **Real-time Updates**: Instant sidebar refresh

**Database Schema:**
```sql
-- Conversations table
CREATE TABLE conversations (
  id VARCHAR PRIMARY KEY,
  title VARCHAR NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
  id VARCHAR PRIMARY KEY,
  role VARCHAR NOT NULL, -- 'USER' or 'ASSISTANT'
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  conversation_id VARCHAR REFERENCES conversations(id) ON DELETE CASCADE
);
```

### 📱 Responsive Design

**Breakpoints:**
- **Mobile** (< 768px): Overlay sidebar, touch-optimized
- **Tablet** (768px - 1024px): Collapsible sidebar
- **Desktop** (> 1024px): Full sidebar experience

**Mobile Features:**
- Touch-friendly interface
- Swipe gestures for sidebar
- Optimized input area
- Responsive text sizing

## 🛠️ Installation & Setup

### Prerequisites

- **Node.js 18+**
- **npm or yarn**
- **PostgreSQL** (or use Prisma's local development database)

### Quick Start

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd queue_chatbot/chat
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
# .env
DATABASE_URL="your-postgresql-connection-string"
OPENAI_API_KEY="your-openai-api-key"
```

4. **Set up database**
```bash
# Start Prisma local database (development)
npm run db:start

# Or run migrations (production)
npx prisma migrate dev
```

5. **Start development server**
```bash
npm run dev
```

6. **Open in browser**
```
http://localhost:3000
```

## 🔧 API Endpoints

### Chat Endpoint
```typescript
POST /api/chat
Content-Type: application/json

{
  "messages": UIMessage[],
  "conversationId": string | null,
  "originalInput": string,
  "optimizedInput": string
}

Response: {
  "content": string,
  "conversationId": string
}
```

### Conversations Endpoint
```typescript
GET /api/conversations
Response: Conversation[]

DELETE /api/conversations?id={conversationId}
Response: { success: boolean }
```

### Input Optimization Endpoint
```typescript
POST /api/optimize-input
Content-Type: application/json

{
  "userInput": string,
  "conversationHistory": UIMessage[]
}

Response: {
  "originalInput": string,
  "optimizedInput": string,
  "error"?: string
}
```

## 🎨 Customization

### Themes
The app uses a dark theme by default. Customize colors in:
- `tailwind.config.mjs` - Tailwind configuration
- Component className props - Individual styling

### Code Highlighting
Syntax highlighting themes can be changed in:
```typescript
// src/components/markdown/CodeBlock.tsx
import { themes } from 'prism-react-renderer';

// Available themes: vsDark, vsLight, github, etc.
<Highlight theme={themes.vsDark} ... />
```

### AI Models
Change the AI model in the API route:
```typescript
// src/app/api/chat/route.ts
body: JSON.stringify({ 
  model: 'gpt-4o-mini', // Change this
  messages: messagesForAPI 
})
```

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push

### Docker
```dockerfile
# Dockerfile included for containerized deployment
FROM node:18-alpine
# ... (standard Next.js Docker setup)
```

### Environment Variables
```bash
# Production .env
DATABASE_URL="postgresql://user:password@host:port/database"
OPENAI_API_KEY="sk-..."
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-secret"
```

## 🧪 Testing

### Running Tests
```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

### Test Coverage
- **Components**: React Testing Library
- **API Routes**: Supertest
- **Database**: Jest with test database
- **E2E**: Playwright

## 📊 Performance

### Optimizations
- **Code Splitting**: Automatic with Next.js
- **Image Optimization**: Next.js Image component
- **Bundle Analysis**: `npm run build` shows bundle size
- **Database Indexing**: Optimized queries with Prisma

### Monitoring
- **Error Tracking**: Console logging (integrate Sentry for production)
- **Performance**: Next.js built-in analytics
- **Database**: Prisma query logging

## 🤝 Contributing

### Development Guidelines
1. Follow the established architecture patterns
2. Write TypeScript for all new code
3. Add tests for new features
4. Update documentation

### Code Style
- **ESLint**: Enforced code style
- **Prettier**: Auto-formatting
- **TypeScript**: Strict mode enabled
- **Naming**: camelCase for variables, PascalCase for components

## 📝 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🙏 Acknowledgments

- **OpenAI** - GPT API
- **Vercel** - Next.js framework
- **Prisma** - Database ORM
- **Tailwind CSS** - Styling framework

---

**Built with ❤️ for developers by developers**

For questions or support, please open an issue on GitHub.