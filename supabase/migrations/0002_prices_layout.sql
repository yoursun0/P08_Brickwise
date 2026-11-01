-- Historical local copy. Live SoT: /workspace/IT/platform/supabase-helic/brickwise_000*.sql
-- (schema brickwise, trigger on_auth_user_created_brickwise). Do not re-apply this public migration on shared helic projects.
-- Dynamic price columns + layout. Source of truth is units.prices jsonb.

alter table public.projects
  add column if not exists price_columns jsonb not null default '[]'::jsonb;

alter table public.projects drop constraint if exists projects_price_basis_check;

alter table public.units
  add column if not exists layout text;

alter table public.units
  add column if not exists prices jsonb not null default '[]'::jsonb;

alter table public.documents
  add column if not exists error_message text;

create index if not exists documents_hash_idx on public.documents(file_hash);

-- New auth users get a profile with the monthly free grant already applied.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, credits_balance, free_credit_month)
  values (
    new.id,
    new.email,
    3,
    to_char(timezone('Asia/Hong_Kong', now()), 'YYYY-MM')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
