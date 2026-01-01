-- Secure Realtime Subscriptions
-- This ensures that the realtime socket respects the Row Level Security policies
-- defined on the tables. Without this, anyone can listen to any change.

-- 1. Enable RLS on the chat_messages table (Duplicate check to be safe)
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- 2. Drop the publication if it exists to reset configuration (Safe in Supabase)
DROP PUBLICATION IF EXISTS supabase_realtime;

-- 3. Re-create the publication for the specific tables we want to broadcast
CREATE PUBLICATION supabase_realtime FOR TABLE chat_messages, notifications;

-- 4. CRITICAL: Enable RLS for the publication
-- This forces Supabase to check RLS policies before sending events to clients.
ALTER PUBLICATION supabase_realtime SET (publish_via_partition_root = true);

-- 5. Ensure the Policy exists for chat_messages (Refresher)
-- Users should only be able to SELECT messages where they are sender or receiver
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'chat_messages' AND policyname = 'Users can view their own messages'
    ) THEN
        CREATE POLICY "Users can view their own messages" 
        ON chat_messages FOR SELECT 
        USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
    END IF;
END $$;