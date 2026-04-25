create table if not exists public.user_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  fcm_token text not null unique,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.user_devices enable row level security;

create policy "Users can manage their own devices"
  on public.user_devices
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_user_devices_user_id on public.user_devices(user_id);