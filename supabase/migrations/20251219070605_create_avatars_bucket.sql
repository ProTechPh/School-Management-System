-- Create avatars storage bucket with public access
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png'])
on conflict (id) do nothing;

-- Create policy to allow public read access
create policy "Public read access for avatars"
on storage.objects for select
using (bucket_id = 'avatars');

-- Create policy to allow authenticated users to upload their own avatars
create policy "Authenticated users can upload avatars"
on storage.objects for insert
with check (
  bucket_id = 'avatars'
  and auth.role() = 'authenticated'
);

-- Create policy to allow users to update their own avatars
create policy "Users can update own avatars"
on storage.objects for update
using (
  bucket_id = 'avatars'
  and auth.role() = 'authenticated'
);

-- Create policy to allow users to delete their own avatars
create policy "Users can delete own avatars"
on storage.objects for delete
using (
  bucket_id = 'avatars'
  and auth.role() = 'authenticated'
);;
