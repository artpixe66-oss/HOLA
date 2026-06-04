-- Programmes fidélité (créés par les commerçants)
create table programmes (
  id uuid primary key default gen_random_uuid(),
  commercant_id text not null default 'demo',
  nom text not null,
  description text default '',
  emoji text default '🏪',
  couleur text default '#3b7bff',
  points_par_visite integer default 1,
  points_objectif integer default 10,
  recompense text not null,
  created_at timestamptz default now()
);

-- Cartes des clients
create table cartes (
  id uuid primary key default gen_random_uuid(),
  programme_id uuid references programmes(id) on delete cascade,
  client_nom text not null,
  client_email text not null,
  points integer default 0,
  numero text not null,
  created_at timestamptz default now()
);

-- Historique des transactions
create table transactions (
  id uuid primary key default gen_random_uuid(),
  carte_id uuid references cartes(id) on delete cascade,
  points integer not null,
  description text not null,
  created_at timestamptz default now()
);

-- Accès public (pour le MVP sans auth)
alter table programmes enable row level security;
alter table cartes enable row level security;
alter table transactions enable row level security;

create policy "public_all" on programmes for all using (true) with check (true);
create policy "public_all" on cartes for all using (true) with check (true);
create policy "public_all" on transactions for all using (true) with check (true);
