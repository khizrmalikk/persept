-- Run once in the Supabase SQL editor (workforce project)
create table if not exists agent_files (
  agent_id text not null,
  path text not null,
  content text,
  hash text,
  updated_at timestamptz default now(),
  primary key (agent_id, path)
);
alter table agent_files enable row level security;
