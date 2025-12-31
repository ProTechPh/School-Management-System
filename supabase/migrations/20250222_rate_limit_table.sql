create table if not exists rate_limits (
  id uuid default gen_random_uuid() primary key,
  identifier text not null,
  endpoint text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_rate_limits_identifier_endpoint on rate_limits(identifier, endpoint);
create index if not exists idx_rate_limits_created_at on rate_limits(created_at);