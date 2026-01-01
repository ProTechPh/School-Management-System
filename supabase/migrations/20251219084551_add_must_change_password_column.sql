-- Add must_change_password column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT true;

-- Set existing users to not require password change (they already have accounts)
UPDATE public.users SET must_change_password = false WHERE must_change_password IS NULL;;
