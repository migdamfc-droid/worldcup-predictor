-- Run this in your Supabase SQL editor to add leagues support

create table leagues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique not null,
  created_by uuid references profiles(id) on delete cascade not null,
  created_at timestamp with time zone default now()
);

create table league_members (
  league_id uuid references leagues(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  joined_at timestamp with time zone default now(),
  primary key (league_id, user_id)
);

alter table leagues enable row level security;
alter table league_members enable row level security;

create policy "Leagues are viewable by members"
  on leagues for select using (
    id in (select league_id from league_members where user_id = auth.uid())
  );

create policy "Anyone can create a league"
  on leagues for insert with check (auth.uid() = created_by);

create policy "League members viewable by members"
  on league_members for select using (
    league_id in (select league_id from league_members where user_id = auth.uid())
  );

create policy "Anyone can join a league"
  on league_members for insert with check (auth.uid() = user_id);

create policy "Users can leave leagues"
  on league_members for delete using (auth.uid() = user_id);

-- Allow looking up a league by code to join it
create policy "Leagues are findable by code"
  on leagues for select using (true);
