-- Run this once in Supabase: Dashboard > SQL Editor > New query > paste > Run

create table if not exists app_data (
  key text primary key,
  value jsonb,
  updated_at timestamptz default now()
);

-- Row Level Security is on by default for new projects. Since this table is
-- only ever accessed through your Vercel serverless function (using the
-- service_role key, which bypasses RLS), no policies are needed here.
alter table app_data enable row level security;
