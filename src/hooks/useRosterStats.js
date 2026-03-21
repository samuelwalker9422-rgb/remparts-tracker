import { useState, useEffect } from 'react';

// LeagueStat team_id for Québec Remparts
const REMPARTS_TEAM_ID = '9';

// Photo URL – same CDN as data.js
const photo = id => `https://assets.leaguestat.com/lhjmq/240x240/${id}.jpg`;

// Map API position strings to the two-value system used throughout the app
function mapPos(apiPos) {
  return apiPos === 'D' ? 'D' : 'F';
}

// Convert a raw API skater record to the shape used in data.js / the rest of the app:
// { num, name, pos, gp, g, a, pts, photo }
function mapSkater(p) {
  return {
    num:  parseInt(p.jersey_number, 10),
    name: `${p.first_name} ${p.last_name}`,
    pos:  mapPos(p.position),
    gp:   parseInt(p.games_played,  10) || 0,
    g:    parseInt(p.goals,         10) || 0,
    a:    parseInt(p.assists,       10) || 0,
    pts:  parseInt(p.points,        10) || 0,
    photo: photo(p.player_id),
    // Extra fields available from the API (used by leagueSkaters for scoring leaders)
    teamCode: (p.team_code ?? '').toUpperCase(),
    teamId:   p.team_id,
  };
}

export function useRosterStats() {
  const [skaters,       setSkaters]       = useState([]);
  const [leagueSkaters, setLeagueSkaters] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch('/api/players');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        const raw = json?.SiteKit?.Skaters ?? [];
        if (cancelled) return;

        // All league skaters sorted by points – used for scoring leaders
        const allMapped = raw
          .map(mapSkater)
          .sort((a, b) => b.pts - a.pts || b.g - a.g);

        // Remparts-only skaters (non-goalie positions only – no goalie view exists)
        const remparts = allMapped.filter(p => p.teamId === REMPARTS_TEAM_ID);

        setLeagueSkaters(allMapped);
        setSkaters(remparts);
        setError(null);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { skaters, leagueSkaters, loading, error };
}
