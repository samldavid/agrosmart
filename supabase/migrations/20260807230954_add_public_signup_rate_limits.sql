create table if not exists app_private.public_signup_attempts (
  id uuid primary key default gen_random_uuid(),
  ip_hash text not null,
  email_hash text not null,
  attempted_at timestamptz not null default now()
);

create index if not exists public_signup_attempts_ip_hash_attempted_at_idx
  on app_private.public_signup_attempts (ip_hash, attempted_at desc);

create index if not exists public_signup_attempts_email_hash_attempted_at_idx
  on app_private.public_signup_attempts (email_hash, attempted_at desc);

alter table app_private.public_signup_attempts enable row level security;

revoke all on table app_private.public_signup_attempts from public;
revoke all on table app_private.public_signup_attempts from anon;
revoke all on table app_private.public_signup_attempts from authenticated;
