# Kanban Board (React + Vite + Supabase)

A sleek, modern Kanban board inspired by Linear/Notion. Fully responsive with smooth drag-and-drop, animations, and persistence via Supabase.

## Tech Stack
- React (Vite)
- Tailwind CSS
- Zustand
- @dnd-kit/core
- Framer Motion
- Lucide React Icons
- React Hot Toast
- Supabase JS Client

## Features
- Create, edit, delete tasks
- Drag tasks across columns (To Do, In Progress, Done)
- Animated interactions (drag, mount/unmount)
- Toast notifications
- Light/Dark mode toggle
- Persistent storage with Supabase

## Project Structure
```
src/
  components/
    Column.jsx
    Header.jsx
    TaskCard.jsx
    TaskModal.jsx
  store/
    taskStore.js
  utils/
    supabaseClient.js
  App.jsx
  main.jsx
  index.css
```

## Setup

1) Install dependencies
```
npm install
```

2) Create a Supabase project and set up the `tasks` table

SQL (Run in Supabase SQL Editor):
```sql
-- Optional (usually already enabled on Supabase)
create extension if not exists pgcrypto;

-- 1) Ensure tasks table exists (your existing statement, idempotent)
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status text not null default 'todo',
  created_at timestamp with time zone default now()
);

-- 2) Drop the old CHECK constraint (so status can be any column key)
-- Try dropping the common default name:
alter table public.tasks drop constraint if exists tasks_status_check;

-- If the constraint had a different auto-generated name, this block finds and drops any CHECK on 'status'
do $$
declare
  conname text;
begin
  select con.conname
    into conname
  from pg_constraint con
    join pg_attribute att on att.attrelid = con.conrelid and att.attnum = any(con.conkey)
    join pg_class rel on rel.oid = con.conrelid
  where con.contype = 'c'
    and rel.relname = 'tasks'
    and att.attname = 'status'
  limit 1;

  if conname is not null then
    execute format('alter table public.tasks drop constraint %I', conname);
  end if;
end $$;

-- 3) Create columns table for dynamic columns
create table if not exists public.columns (
  key text primary key,
  label text not null,
  position int not null
);

-- 4) (Optional) RLS policies for demo; adjust for auth in production
alter table public.columns enable row level security;

do $pol$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='columns' and policyname='Allow read columns'
  ) then
    create policy "Allow read columns" on public.columns for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='columns' and policyname='Allow insert columns'
  ) then
    create policy "Allow insert columns" on public.columns for insert with check (true);
  end if;
end
$pol$;

-- 5) (Optional) Seed default columns if empty
insert into public.columns (key, label, position)
select * from (values
  ('todo', 'To Do', 1),
  ('inprogress', 'In Progress', 2),
  ('done', 'Done', 3)
) as v(key, label, position)
where not exists (select 1 from public.columns);

-- Optional: enable RLS and allow anon CRUD for demo (lock down for production)
alter table public.tasks enable row level security;
create policy "Allow read" on public.tasks for select using (true);
create policy "Allow insert" on public.tasks for insert with check (true);
create policy "Allow update" on public.tasks for update using (true);
create policy "Allow delete" on public.tasks for delete using (true);
```

3) Environment variables

Create `.env` (or set in Vercel):
```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

4) Start dev server
```
npm run dev
```

## Deployment (Vercel)
- Push repo to GitHub
- Import in Vercel
- Set Environment Variables:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- Build command: `npm run build`
- Output directory: `dist`

## Accessibility & Performance
- Focus outline retained for keyboard nav
- ARIA labels for columns and dialog
- Lightweight deps and Vite for fast builds

## Notes
- Shadcn-like styles are provided via Tailwind utility classes for modals, buttons, inputs. You can swap them with shadcn/ui components if preferred.
- For authentication, integrate Supabase Auth and scope policies by `auth.uid()`. (Optional extension.)
