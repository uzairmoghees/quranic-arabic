-- Run this once in Supabase: SQL Editor → New query → paste → Run.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  role text not null default 'student' check (role in ('student','teacher')),
  created_at timestamptz not null default now()
);

create table if not exists public.progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  summary jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.progress enable row level security;

-- helpers (security definer so policies don't loop back on themselves)
create or replace function public.is_teacher() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher');
$$;
create or replace function public.my_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

-- profiles: everyone sees their own; the teacher sees all. Students can't make themselves teachers.
drop policy if exists "profiles read" on public.profiles;
create policy "profiles read" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_teacher());
drop policy if exists "profiles insert" on public.profiles;
create policy "profiles insert" on public.profiles for insert to authenticated
  with check (id = auth.uid() and role = 'student');
drop policy if exists "profiles update" on public.profiles;
create policy "profiles update" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid() and role = public.my_role());

-- progress: each student reads/writes only their own row; the teacher can read everyone's.
drop policy if exists "progress read" on public.progress;
create policy "progress read" on public.progress for select to authenticated
  using (user_id = auth.uid() or public.is_teacher());
drop policy if exists "progress insert" on public.progress;
create policy "progress insert" on public.progress for insert to authenticated
  with check (user_id = auth.uid());
drop policy if exists "progress update" on public.progress;
create policy "progress update" on public.progress for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- AFTER you have signed in to the app once with your own account, make yourself the teacher:
-- (replace the email with yours, then run just this line)
-- update public.profiles set role = 'teacher' where id = (select id from auth.users where email = 'you@example.com');
