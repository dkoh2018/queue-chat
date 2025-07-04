-- Create User table
CREATE TABLE IF NOT EXISTS "User" (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add userId column to Conversation table
ALTER TABLE "Conversation" ADD COLUMN "userId" UUID;

-- Set default value for existing records
UPDATE "Conversation" SET "userId" = '00000000-0000-0000-0000-000000000000' WHERE "userId" IS NULL;

-- Make the column NOT NULL
ALTER TABLE "Conversation" ALTER COLUMN "userId" SET NOT NULL;

-- Add foreign key constraint
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- Create index for better performance
CREATE INDEX "Conversation_userId_idx" ON "Conversation"("userId");

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "User" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();