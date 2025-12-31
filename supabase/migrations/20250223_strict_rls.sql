-- Ensure only admins or service role can update user status
create policy "Only admins can update users"
on users
for update
using (
  auth.uid() in (
    select id from users where role = 'admin'
  )
);

-- Ensure public cannot update user status
alter table users enable row level security;