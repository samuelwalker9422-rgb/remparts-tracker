-- ============================================================
-- QMJHL Fantasy League — GM + Coach System
-- Phase 1: Schema + RLS
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query)
-- ============================================================

-- ── Fantasy leagues ──────────────────────────────────────────────────────────
create table public.fantasy_leagues (
  id                  uuid        default gen_random_uuid() primary key,
  name                text        not null,
  commissioner_id     uuid        references public.profiles(id) on delete cascade,
  season              text        not null default '2026-27',
  num_teams           int         not null default 10,
  draft_type          text        not null default 'snake',
  draft_status        text        not null default 'pending',
  draft_scheduled_at  timestamptz,
  scoring_settings    jsonb       not null default '{
    "goal": 3, "assist": 2, "ppg_bonus": 1, "ppa_bonus": 0.5,
    "shg_bonus": 2, "plus": 0.5, "minus": -0.5, "pim": -0.1,
    "hat_trick": 3, "goalie_win": 5, "shutout": 4,
    "save": 0.2, "goals_against": -1
  }'::jsonb,
  invite_code         text        unique default upper(substring(md5(random()::text), 1, 6)),
  status              text        not null default 'setup',
  created_at          timestamptz default now()
);

-- ── Teams within a league ─────────────────────────────────────────────────────
create table public.fantasy_league_teams (
  id            uuid        default gen_random_uuid() primary key,
  league_id     uuid        references public.fantasy_leagues(id) on delete cascade,
  user_id       uuid        references public.profiles(id) on delete cascade,
  team_name     text        not null,
  draft_position int,
  total_points  numeric     default 0,
  created_at    timestamptz default now(),
  unique(league_id, user_id)
);

-- ── Full 25-man roster ────────────────────────────────────────────────────────
create table public.fantasy_rosters (
  id               uuid        default gen_random_uuid() primary key,
  league_team_id   uuid        references public.fantasy_league_teams(id) on delete cascade,
  player_id        text        not null,
  player_name      text        not null,
  player_team_code text        not null,
  position         text        not null,  -- F / D / G
  acquired_via     text        not null default 'draft',  -- draft / trade / waiver
  created_at       timestamptz default now(),
  unique(league_team_id, player_id)
);

-- ── Weekly line combinations (coach role) ─────────────────────────────────────
-- 13F + 7D + 2G = 22 active; 1F + 1D + 1G = 3 scratches
create table public.fantasy_lines (
  id              uuid        default gen_random_uuid() primary key,
  league_team_id  uuid        references public.fantasy_league_teams(id) on delete cascade,
  week_number     int         not null,
  season          text        not null default '2026-27',
  -- Forward lines (player_id references, null = bench/not set)
  line1_lw  text, line1_c  text, line1_rw  text,
  line2_lw  text, line2_c  text, line2_rw  text,
  line3_lw  text, line3_c  text, line3_rw  text,
  line4_lw  text, line4_c  text, line4_rw  text,
  -- Defence pairs
  pair1_ld  text, pair1_rd  text,
  pair2_ld  text, pair2_rd  text,
  pair3_ld  text, pair3_rd  text,
  -- Goalies
  starting_goalie text,
  backup_goalie   text,
  -- 3 healthy scratches
  scratch1 text, scratch2 text, scratch3 text,
  locked     boolean     default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(league_team_id, week_number, season)
);

-- ── Draft picks log ───────────────────────────────────────────────────────────
create table public.fantasy_draft_picks (
  id              uuid        default gen_random_uuid() primary key,
  league_id       uuid        references public.fantasy_leagues(id) on delete cascade,
  round           int         not null,
  pick_number     int         not null,   -- pick within the round
  overall_pick    int         not null,   -- 1-based across all rounds
  league_team_id  uuid        references public.fantasy_league_teams(id),
  player_id       text,
  player_name     text,
  position        text,
  player_team_code text,
  auto_picked     boolean     default false,
  picked_at       timestamptz,
  created_at      timestamptz default now(),
  unique(league_id, overall_pick)
);

-- ── Waiver claims ─────────────────────────────────────────────────────────────
create table public.fantasy_waiver_claims (
  id               uuid        default gen_random_uuid() primary key,
  league_id        uuid        references public.fantasy_leagues(id) on delete cascade,
  league_team_id   uuid        references public.fantasy_league_teams(id) on delete cascade,
  add_player_id    text        not null,
  add_player_name  text        not null,
  drop_player_id   text,
  drop_player_name text,
  status           text        not null default 'pending',  -- pending / approved / denied
  created_at       timestamptz default now()
);

-- ── Trade offers between GMs ──────────────────────────────────────────────────
create table public.fantasy_trades (
  id                 uuid        default gen_random_uuid() primary key,
  league_id          uuid        references public.fantasy_leagues(id) on delete cascade,
  offering_team_id   uuid        references public.fantasy_league_teams(id) on delete cascade,
  receiving_team_id  uuid        references public.fantasy_league_teams(id) on delete cascade,
  offer_players      jsonb       not null default '[]',    -- [{player_id, player_name, position}]
  receive_players    jsonb       not null default '[]',
  status             text        not null default 'pending',  -- pending / accepted / rejected / withdrawn
  message            text,
  created_at         timestamptz default now(),
  responded_at       timestamptz
);

-- ============================================================
-- RLS
-- ============================================================

alter table public.fantasy_leagues        enable row level security;
alter table public.fantasy_league_teams   enable row level security;
alter table public.fantasy_rosters        enable row level security;
alter table public.fantasy_lines          enable row level security;
alter table public.fantasy_draft_picks    enable row level security;
alter table public.fantasy_waiver_claims  enable row level security;
alter table public.fantasy_trades         enable row level security;

-- fantasy_leagues
create policy "leagues_read"   on public.fantasy_leagues for select using (true);
create policy "leagues_insert" on public.fantasy_leagues for insert with check (auth.uid() = commissioner_id);
create policy "leagues_update" on public.fantasy_leagues for update using  (auth.uid() = commissioner_id);

-- fantasy_league_teams
create policy "league_teams_read"   on public.fantasy_league_teams for select using (true);
create policy "league_teams_insert" on public.fantasy_league_teams for insert with check (auth.uid() = user_id);
create policy "league_teams_update" on public.fantasy_league_teams for update using  (auth.uid() = user_id);

-- fantasy_rosters
create policy "rosters_read" on public.fantasy_rosters for select using (true);
create policy "rosters_insert" on public.fantasy_rosters for insert with check (
  auth.uid() = (select user_id from public.fantasy_league_teams where id = league_team_id)
);
create policy "rosters_delete" on public.fantasy_rosters for delete using (
  auth.uid() = (select user_id from public.fantasy_league_teams where id = league_team_id)
);

-- fantasy_lines
create policy "lines_read"   on public.fantasy_lines for select using (true);
create policy "lines_insert" on public.fantasy_lines for insert with check (
  auth.uid() = (select user_id from public.fantasy_league_teams where id = league_team_id)
);
create policy "lines_update" on public.fantasy_lines for update using (
  auth.uid() = (select user_id from public.fantasy_league_teams where id = league_team_id)
  and locked = false
);

-- fantasy_draft_picks (commissioner-controlled, broad insert/update for draft clock)
create policy "draft_picks_read"   on public.fantasy_draft_picks for select using (true);
create policy "draft_picks_insert" on public.fantasy_draft_picks for insert with check (true);
create policy "draft_picks_update" on public.fantasy_draft_picks for update using  (true);

-- fantasy_waiver_claims (own rows only)
create policy "waivers_own" on public.fantasy_waiver_claims for all using (
  auth.uid() = (select user_id from public.fantasy_league_teams where id = league_team_id)
);

-- fantasy_trades (only parties to the trade can see/act on it)
create policy "trades_read" on public.fantasy_trades for select using (
  auth.uid() = (select user_id from public.fantasy_league_teams where id = offering_team_id)
  or auth.uid() = (select user_id from public.fantasy_league_teams where id = receiving_team_id)
);
create policy "trades_insert" on public.fantasy_trades for insert with check (
  auth.uid() = (select user_id from public.fantasy_league_teams where id = offering_team_id)
);
create policy "trades_update" on public.fantasy_trades for update using (
  auth.uid() = (select user_id from public.fantasy_league_teams where id = receiving_team_id)
);
