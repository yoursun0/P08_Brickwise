-- Brickwise MVP schema
create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  credits_balance int not null default 0,
  free_credit_month text,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  price_basis text not null default 'lowest' check (price_basis in ('original','plan_a','plan_b','lowest')),
  created_at timestamptz not null default now()
);
create index if not exists projects_user_idx on public.projects(user_id);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  file_name text not null,
  file_type text not null check (file_type in ('pdf','png','jpg')),
  page_count int not null default 1,
  file_hash text,
  status text not null default 'uploaded' check (status in ('uploaded','processing','succeeded','failed')),
  extraction_confidence numeric,
  created_at timestamptz not null default now()
);
create index if not exists documents_project_idx on public.documents(project_id);

create table if not exists public.units (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  source_document_id uuid references public.documents(id) on delete set null,
  tower text,
  floor_raw text not null,
  floor_sort_key int not null,
  unit_no text not null,
  saleable_area_sqft numeric not null,
  price_original numeric,
  price_plan_a numeric,
  price_plan_b numeric,
  computed_price numeric,
  psf numeric,
  tags text[] not null default '{}',
  explainability jsonb not null default '{}'::jsonb,
  extraction_confidence numeric not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists units_project_idx on public.units(project_id);
create index if not exists units_project_floor_idx on public.units(project_id, floor_sort_key);
create index if not exists units_project_unit_idx on public.units(project_id, unit_no);

create table if not exists public.shortlist_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  unit_id uuid not null references public.units(id) on delete cascade,
  rank int not null default 0,
  created_at timestamptz not null default now(),
  unique (project_id, unit_id)
);
create index if not exists shortlist_project_idx on public.shortlist_items(project_id);

-- RLS
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.documents enable row level security;
alter table public.units enable row level security;
alter table public.shortlist_items enable row level security;

create policy "own profile" on public.profiles for select using (auth.uid() = id);
create policy "manage own profile" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "own projects" on public.projects for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own documents" on public.documents for all using (
  exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
) with check (
  exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
);

create policy "own units" on public.units for all using (
  exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
) with check (
  exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
);

create policy "own shortlist" on public.shortlist_items for all using (
  exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
) with check (
  exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
);
