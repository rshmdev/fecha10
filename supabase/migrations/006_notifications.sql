create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null default '',
  type text not null default 'general',
  pelada_id uuid references public.peladas(id) on delete cascade,
  data jsonb default '{}',
  is_read boolean default false,
  created_at timestamptz default now()
);

alter table public.notifications enable row level security;

create policy "Users can view their own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can update their own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

create index idx_notifications_user_id on public.notifications(user_id);
create index idx_notifications_user_unread on public.notifications(user_id, is_read) where is_read = false;
create index idx_notifications_created_at on public.notifications(created_at desc);