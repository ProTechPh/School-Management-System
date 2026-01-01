-- Allow authenticated users to insert messages where they are the sender
CREATE POLICY "Users can send messages" ON chat_messages
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = sender_id);

-- Allow users to update messages they received (for marking as read)
CREATE POLICY "Users can update received messages" ON chat_messages
FOR UPDATE TO authenticated
USING (auth.uid() = receiver_id)
WITH CHECK (auth.uid() = receiver_id);;
