-- Run this in your Supabase SQL editor

create table profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  created_at timestamp with time zone default now()
);

create table predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  group_predictions jsonb default '{}',
  knockout_predictions jsonb default '{}',
  tournament_winner text default '',
  top_scorer text default '',
  top_assister text default '',
  best_player text default '',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(user_id)
);

create table actual_results (
  id integer primary key default 1 check (id = 1),
  group_results jsonb default '{}',
  knockout_results jsonb default '{}',
  tournament_winner text default '',
  top_scorer text default '',
  top_assister text default '',
  best_player text default '',
  updated_at timestamp with time zone default now()
);

-- Insert the singleton actual_results row
insert into actual_results (id) values (1);

-- RLS policies
alter table profiles enable row level security;
alter table predictions enable row level security;
alter table actual_results enable row level security;

create policy "Public profiles are viewable by everyone"
  on profiles for select using (true);

create policy "Users can insert their own profile"
  on profiles for insert with check (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update using (auth.uid() = id);

create policy "Predictions are viewable by everyone"
  on predictions for select using (true);

create policy "Users can insert their own predictions"
  on predictions for insert with check (auth.uid() = user_id);

create policy "Users can update their own predictions"
  on predictions for update using (auth.uid() = user_id);

create policy "Actual results are viewable by everyone"
  on actual_results for select using (true);

create policy "Anyone can update actual results"
  on actual_results for update using (true);
