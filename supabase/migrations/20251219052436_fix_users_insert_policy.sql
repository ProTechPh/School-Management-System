-- Drop the existing insert policy
DROP POLICY IF EXISTS "Users can insert own data" ON users;

-- Create a new policy that allows authenticated users to insert their own record
CREATE POLICY "Users can insert own data" ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Also add a policy for service role / anon to insert (for signup flow)
CREATE POLICY "Allow signup insert" ON users
  FOR INSERT
  TO anon
  WITH CHECK (true);;
