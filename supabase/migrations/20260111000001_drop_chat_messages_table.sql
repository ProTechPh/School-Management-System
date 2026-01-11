-- Remove chat_messages from realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS chat_messages;

-- Drop all policies on chat_messages
DROP POLICY IF EXISTS "Users can view their own messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can send messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can update received messages" ON chat_messages;

-- Drop the chat_messages table
DROP TABLE IF EXISTS chat_messages;

-- Update notifications type constraint to remove 'chat' type
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
  CHECK (type IN ('info', 'success', 'warning', 'assignment', 'grade', 'attendance', 'quiz', 'lesson', 'announcement'));
