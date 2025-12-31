-- Enable Row Level Security
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to ensure clean state
DROP POLICY IF EXISTS "Users can view their own messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can send messages" ON chat_messages;

-- Policy: Users can only view messages where they are the sender or receiver
CREATE POLICY "Users can view their own messages"
ON chat_messages FOR SELECT
USING (
  auth.uid() = sender_id OR 
  auth.uid() = receiver_id
);

-- Policy: Users can insert messages where they are the sender
CREATE POLICY "Users can send messages"
ON chat_messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
);