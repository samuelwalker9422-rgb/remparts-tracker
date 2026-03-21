import { useState, useEffect } from 'react';

// Active Remparts jersey numbers (skaters only — goalies stay in data.js).
// Matched together with team_code === 'Que' to prevent cross-team collisions.
const ACTIVE_SKATER_JERSEYS = new Set([
  5, 6, 9, 13, 14, 15, 16, 19, 21, 24, 25, 26, 27, 29,
  37, 55, 63, 71, 77, 86, 88, 91,
]);

// Photo URL – same CDN as data.js
const photo = id => `https://assets.leaguestat.com/lhjmq/240x240/${id}.jpg`;

// Map API position strings to the two-value system used throughout the app.
// Goalies (pos='G') are excluded before this is called — they live in data.js.
function mapPos(apiPos) {
  return apiPos === 'D' ? 'D' : 'F';
}

// Convert a raw API skater record to the shape used in data.js / the rest of the app:
// { num, name, pos, gp, g, a, pts, photo }
function mapSkater(p) {
  // tp_jersey_number is a fallback when jersey_number is empty (avoids #NaN)
  const rawNum = p.jersey_number || p.tp_jersey_number || '';
  return {
    num:  parseInt(rawNum, 10),
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
    apiPos:   p.position,
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

        // All league skaters sorted by points – used for scoring leaders.
        // Exclude goalies (pos='G') so they don't shadow data.js goalie entries.
        const allMapped = raw
          .filter(p => p.position !== 'G')
          .map(mapSkater)
          .filter(p => !isNaN(p.num))
          .sort((a, b) => b.pts - a.pts || b.g - a.g);

        // Active Remparts skaters — whitelist by jersey number.
        // Sort by GP desc first so if two players share a jersey number the
        // active one (more GP) wins after deduplication.
        const byGP = [...allMapped].sort((a, b) => b.gp - a.gp);
        const seen = new Set();
        const remparts = byGP.filter(p => {
          if (p.teamCode !== 'QUE') return false;
          if (!ACTIVE_SKATER_JERSEYS.has(p.num)) return false;
          if (seen.has(p.num)) return false;
          seen.add(p.num);
          return true;
        });

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
