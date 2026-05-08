-- =============================================
-- ProspectAI — Setup Neon (coller dans l'éditeur SQL de Neon)
-- =============================================

-- 1. Table des utilisateurs
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password_hash text not null,
  role text not null default 'telepro' check (role in ('admin', 'telepro')),
  created_at timestamptz default now()
);

-- 2. Table des leads CRM
create table if not exists crm_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  place_id text not null,
  business jsonb not null,
  status text default 'nouveau' check (status in ('nouveau','contacte','interesse','signe','pas_interesse')),
  note text default '',
  rappel_at timestamptz,
  rappel_direction text check (rappel_direction in ('je_rappelle','ils_rappellent')),
  site_cree boolean default false,
  added_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, place_id)
);

-- 3. Désactiver RLS (on utilise le service role côté serveur)
alter table users disable row level security;
alter table crm_entries disable row level security;

-- 4. Créer le compte admin (sacha.tanton / 260808)
-- Le hash bcrypt ci-dessous correspond au mot de passe "260808"
insert into users (username, password_hash, role)
values (
  'sacha.tanton',
  '$2b$10$/dq.GUtg/CBIhNaqmBvZieMOgMJoeHQ1/R3JG/Ihv3kd4MtJtkEHu', -- hash bcrypt de "260808"
  'admin'
)
on conflict (username) do nothing;
