create table rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  topic text not null,
  side_a_label text not null default '正方',
  side_b_label text not null default '反方',
  debaters_a jsonb not null default '[]',
  debaters_b jsonb not null default '[]',
  timer_default_seconds int not null default 120,
  pre_vote_snapshot jsonb,
  final_snapshot jsonb,
  status text not null default 'setup',
  created_at timestamptz not null default now()
);

create table votes (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  device_id text not null,
  side text not null check (side in ('a','b')),
  updated_at timestamptz not null default now(),
  unique (room_id, device_id)
);

alter table rooms enable row level security;
alter table votes enable row level security;
create policy "rooms readable" on rooms for select using (true);
create policy "votes readable" on votes for select using (true);

alter publication supabase_realtime add table votes;
