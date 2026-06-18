-- Run this in Supabase SQL Editor if the bucket does not exist.
-- The backend uses your Supabase SERVICE_ROLE_KEY, so no public insert policy is required.
insert into storage.buckets (id, name, public)
values ('meal-photos', 'meal-photos', false)
on conflict (id) do nothing;
