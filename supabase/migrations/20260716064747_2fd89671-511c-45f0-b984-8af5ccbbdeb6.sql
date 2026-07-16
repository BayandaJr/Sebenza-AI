
alter table public.profiles
  add column if not exists avatar_url text not null default '',
  add column if not exists department text not null default '',
  add column if not exists productivity_score integer not null default 75,
  add column if not exists preferred_tone text not null default 'professional',
  add column if not exists preferred_email_style text not null default 'concise',
  add column if not exists working_hours_start text not null default '09:00',
  add column if not exists working_hours_end text not null default '17:00',
  add column if not exists accent_color text not null default 'blue',
  add column if not exists sidebar_layout text not null default 'expanded',
  add column if not exists dashboard_layout text not null default 'grid';

create table if not exists public.saved_emails (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '',
  content text not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.saved_emails to authenticated;
grant all on public.saved_emails to service_role;
alter table public.saved_emails enable row level security;
create policy "own emails all" on public.saved_emails for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.saved_meetings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '',
  content text not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.saved_meetings to authenticated;
grant all on public.saved_meetings to service_role;
alter table public.saved_meetings enable row level security;
create policy "own meetings all" on public.saved_meetings for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.saved_research (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '',
  content text not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.saved_research to authenticated;
grant all on public.saved_research to service_role;
alter table public.saved_research enable row level security;
create policy "own research all" on public.saved_research for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.saved_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '',
  content text not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.saved_reports to authenticated;
grant all on public.saved_reports to service_role;
alter table public.saved_reports enable row level security;
create policy "own reports all" on public.saved_reports for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.prompt_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  feature text not null default 'general',
  prompt text not null,
  response text not null default '',
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.prompt_history to authenticated;
grant all on public.prompt_history to service_role;
alter table public.prompt_history enable row level security;
create policy "own history all" on public.prompt_history for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Storage policies for avatars (private bucket, first folder = user id)
create policy "avatar owner read" on storage.objects for select to authenticated using (
  bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "avatar owner upload" on storage.objects for insert to authenticated with check (
  bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "avatar owner update" on storage.objects for update to authenticated using (
  bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "avatar owner delete" on storage.objects for delete to authenticated using (
  bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
);
