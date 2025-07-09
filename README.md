# Queue Chat

An asynchronous chat application featuring intelligent message queue processing and two-stage AI optimization for enhanced conversational context and response quality.

![Queue Chat Demo](./public/demo.gif)

[📹 **Watch Full Demo Video**](./public/demo.mp4) *(Click to view complete walkthrough with controls)*

## Problem Statement

Traditional chat-based AI interactions follow a linear, depth-first conversation pattern that can be inefficient for complex, multi-faceted queries. Users often experience:

- **Context Fragmentation**: Sequential questioning prevents the AI from understanding the full scope of the inquiry
- **Processing Inefficiency**: Users must wait for each response before formulating the next question
- **Suboptimal Response Quality**: Limited context results in less comprehensive and accurate responses

## Solution Architecture

Queue Chat implements an asynchronous message queue system that enables breadth-first conversation exploration, allowing users to batch related queries for enhanced contextual processing.

### Core Features

- **Asynchronous Message Queue**: Users can submit multiple queries at once, which are processed sequentially. The queue can be reordered via drag-and-drop and shows real-time status updates.

- **Two-Stage AI Processing**: A pipeline that first uses an AI model to optimize the user's input, then passes the refined prompt to a second model for response generation. This improves the context and quality of the final answer.

- **AI-Assisted Diagramming**: The application detects user requests for diagrams and uses a specialized system prompt to guide the LLM in generating valid Mermaid.js syntax. This makes diagram generation more reliable.

- **Responsive UI**: The interface is built with TypeScript and features a responsive design with reusable components for the chat, message queue, and markdown rendering.

## Technical Implementation

### Frontend Architecture
```
├── useChat Hook          # Queue state management and API orchestration
├── MessageQueueView      # Queue visualization and user interactions  
├── QueueToggle          # Queue visibility controls
└── ChatView             # Main conversation interface
```

### Backend Processing
- RESTful API endpoints for queue management
- OpenAI API integration with prompt optimization
- PostgreSQL persistence layer with Prisma ORM

### Architectural Highlights
- **Contextual Improvement**: The two-stage AI process provides the main model with a clearer, more detailed prompt, leading to more relevant responses.
- **Efficient Workflow**: The message queue allows for a "breadth-first" questioning style, where users can offload multiple related thoughts at once instead of waiting for a linear conversation.
- **Modern Foundation**: The stack (Next.js, Prisma, PostgreSQL) provides a robust, type-safe, and scalable base for the application.

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- OpenAI API key

### Installation

```bash
# Clone and install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your Supabase credentials and OPENAI_API_KEY

# Initialize database (run the SQL script in your Supabase dashboard)
# See scripts/init_database.sql

# Start development server
npm run dev
```

Access the application at [http://localhost:3000](http://localhost:3000)

## Tech Stack

- **Frontend**: Next.js 13+ (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase, PostgreSQL
- **AI Integration**: OpenAI API with custom prompt optimization pipeline
- **State Management**: React hooks with optimistic updates