-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add user_id column to conversations table
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES public.users(id);

-- Update conversations table to make user_id NOT NULL for new records
-- (existing records will have NULL user_id until populated)
-- ALTER TABLE public.conversations 
-- ALTER COLUMN user_id SET NOT NULL; -- Don't run this until you populate existing data

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON public.conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);