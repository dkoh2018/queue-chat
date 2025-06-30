# Jarvis Chat

Jarvis Chat is a sophisticated and modern chat application built with Next.js. It features intelligent input optimization, real time conversations, and a professional interface designed for developers, complete with syntax highlighted code blocks.

## Overview

Jarvis Chat provides a familiar chat interface with specialized features for developers. These include intelligent input optimization to improve AI responses, a real time chat interface for a seamless user experience, and persistent conversation history backed by a PostgreSQL database. The application is fully responsive and works well on desktop, tablet, and mobile devices.

## Architecture

The application is built with a modern technology stack. The frontend uses Next.js and React with TypeScript for type safety and Tailwind CSS for styling. The backend is powered by Next.js API Routes, with Prisma ORM for database access to a PostgreSQL database. The chat and optimization features are powered by the OpenAI API.

## Features

### Intelligent Input Optimization

The application uses a two stage AI processing system. First, user input is enhanced by an optimization AI that considers the conversation history. This enhanced input is then sent to the main AI, which generates a higher quality response. This results in more detailed and contextual answers.

### Chat Interface

The chat interface provides real time message exchange with typing indicators during AI processing. Conversations are saved and can be resumed in later sessions. The interface supports user messages, AI assistant messages with markdown rendering, and code blocks with syntax highlighting.

### Developer Focused UI

The user interface is designed with developers in mind. Code can be displayed in full blocks or inline. The application supports automatic syntax highlighting for many popular programming languages.

### Conversation Management

Conversations are stored in a PostgreSQL database. Titles for new conversations are automatically generated from the first message. Users can also delete conversations, which are then removed from the history.

## Installation and Setup

To get started, you will need Node.js, npm or yarn, and a PostgreSQL database.

1.  Clone the repository.
2.  Install the dependencies using `npm install`.
3.  Set up your environment variables by creating a `.env` file with your database connection string and OpenAI API key.
4.  Set up the database by running `npx prisma migrate dev`.
5.  Start the development server with `npm run dev`.
6.  Open your browser to `http://localhost:3000`.

## API Endpoints

The application exposes several API endpoints for chat, conversation management, and input optimization.

*   `POST /api/chat`: Sends a message to the chat AI and returns the response.
*   `GET /api/conversations`: Retrieves the list of all conversations.
*   `DELETE /api/conversations?id={conversationId}`: Deletes a specific conversation.
*   `POST /api/optimize-input`: Optimizes user input before sending it to the chat AI.

## Customization

The application's dark theme can be customized in the Tailwind CSS configuration file. The syntax highlighting theme can be changed in the `CodeBlock.tsx` component. The AI model can be changed in the chat API route.

## Deployment

The application is designed for easy deployment to Vercel. Simply connect your GitHub repository to Vercel and set the required environment variables. The application can also be deployed using Docker.

## Contributing

Contributions are welcome. Please follow the established architecture patterns, write TypeScript for all new code, and add tests for new features.