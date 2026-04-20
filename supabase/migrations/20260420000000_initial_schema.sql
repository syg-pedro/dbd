create extension if not exists pgcrypto;

create type public.person_role as enum ('requester', 'designer');
create type public.demand_status as enum ('inbox', 'today', 'later', 'done', 'blocked');
create type public.demand_priority as enum ('low', 'medium', 'high');
create type public.demand_link_kind as enum ('reference', 'artwork');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.people (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  role public.person_role not null,
  email text,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.demand_types (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text not null,
  default_value_cents integer not null default 0 check (default_value_cents >= 0),
  default_minutes integer not null default 0 check (default_minutes >= 0),
  default_deadline_days integer not null default 3 check (default_deadline_days >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, slug)
);

create table public.demands (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  status public.demand_status not null default 'inbox',
  client text not null,
  type_id uuid references public.demand_types(id) on delete set null,
  type_name text not null default 'Feed',
  title text not null,
  original_request text not null,
  content text,
  additional text,
  notes text,
  references_text text,
  priority public.demand_priority not null default 'medium',
  requester_id uuid references public.people(id) on delete set null,
  designer_id uuid references public.people(id) on delete set null,
  artwork_url text,
  requested_at date not null default current_date,
  due_at date,
  delivery_at date,
  posting_at date,
  value_cents integer not null default 0 check (value_cents >= 0),
  spent_minutes integer not null default 0 check (spent_minutes >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.demand_links (
  id uuid primary key default gen_random_uuid(),
  demand_id uuid not null references public.demands(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  label text,
  url text not null,
  kind public.demand_link_kind not null default 'reference',
  created_at timestamptz not null default now()
);

create table public.demand_files (
  id uuid primary key default gen_random_uuid(),
  demand_id uuid not null references public.demands(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  mime_type text,
  size_bytes integer check (size_bytes is null or size_bytes >= 0),
  created_at timestamptz not null default now()
);

create index people_owner_role_idx on public.people(owner_id, role);
create index demand_types_owner_idx on public.demand_types(owner_id, is_active);
create index demands_owner_status_idx on public.demands(owner_id, status);
create index demands_owner_due_idx on public.demands(owner_id, due_at);
create index demand_links_demand_idx on public.demand_links(demand_id);
create index demand_files_demand_idx on public.demand_files(demand_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger people_set_updated_at
before update on public.people
for each row execute function public.set_updated_at();

create trigger demand_types_set_updated_at
before update on public.demand_types
for each row execute function public.set_updated_at();

create trigger demands_set_updated_at
before update on public.demands
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.people enable row level security;
alter table public.demand_types enable row level security;
alter table public.demands enable row level security;
alter table public.demand_links enable row level security;
alter table public.demand_files enable row level security;

create policy "Profiles are self-owned"
on public.profiles for all
using (id = auth.uid())
with check (id = auth.uid());

create policy "People are self-owned"
on public.people for all
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "Demand types are self-owned"
on public.demand_types for all
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "Demands are self-owned"
on public.demands for all
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "Demand links are self-owned"
on public.demand_links for all
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "Demand files are self-owned"
on public.demand_files for all
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.people to authenticated;
grant select, insert, update, delete on public.demand_types to authenticated;
grant select, insert, update, delete on public.demands to authenticated;
grant select, insert, update, delete on public.demand_links to authenticated;
grant select, insert, update, delete on public.demand_files to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('demand-files', 'demand-files', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

create policy "Demand files are readable by owner"
on storage.objects for select
using (
  bucket_id = 'demand-files'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Demand files are uploadable by owner"
on storage.objects for insert
with check (
  bucket_id = 'demand-files'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Demand files are editable by owner"
on storage.objects for update
using (
  bucket_id = 'demand-files'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'demand-files'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Demand files are removable by owner"
on storage.objects for delete
using (
  bucket_id = 'demand-files'
  and (storage.foldername(name))[1] = auth.uid()::text
);
