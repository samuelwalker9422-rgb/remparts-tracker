import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// Scoring weights
// Hat tricks (+3) require per-game data we don't have from cumulative stats — excluded.
function calcFpts(s) {
  const g   = s?.g   ?? 0;
  const a   = s?.a   ?? 0;
  const ppg = s?.ppg ?? 0;
  const ppa = s?.ppa ?? 0;
  const shg = s?.shg ?? 0;
  const pm  = s?.plus_minus ?? 0;
  const pim = s?.pim ?? 0;
  return +(
    g   * 3    +
    a   * 2    +
    ppg * 1    +
    ppa * 0.5  +
    shg * 2    +
    pm  * 0.5  +   // +0.5 per plus, −0.5 per minus
    pim * -0.1
  ).toFixed(1);
}

export { calcFpts };

// leagueId — pass null to skip (hook is always called but does nothing)
export function useFantasyScoring(leagueId) {
  const [teamScores,  setTeamScores]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const calculate = useCallback(async () => {
    if (!leagueId) { setLoading(false); return; }
    try {
      // 1. Fetch all teams in this league
      const { data: teams = [] } = await supabase
        .from('fantasy_league_teams')
        .select('id, team_name, total_points')
        .eq('league_id', leagueId);

      if (!teams.length) { setTeamScores([]); setLoading(false); return; }

      // 2. Fetch rosters + playoff stats in parallel
      const teamIds = teams.map(t => t.id);
      const [rostersRes, playersRes] = await Promise.all([
        supabase.from('fantasy_rosters').select('*').in('league_team_id', teamIds),
        fetch('/api/playoffplayers')
          .then(r => r.ok ? r.json() : { players: [] })
          .catch(() => ({ players: [] })),
      ]);

      const rosters  = rostersRes.data ?? [];
      const statsMap = Object.fromEntries(
        (playersRes.players ?? []).map(p => [p.player_id, p])
      );

      // 3. Score each team
      const scores = teams.map(team => {
        const teamRoster = rosters.filter(r => r.league_team_id === team.id);
        const playerBreakdown = teamRoster.map(r => {
          const stats = statsMap[r.player_id] ?? {};
          return { ...r, stats, fpts: calcFpts(stats) };
        });
        const totalPts = +(
          playerBreakdown.reduce((sum, p) => sum + p.fpts, 0)
        ).toFixed(1);
        return { leagueTeamId: team.id, teamName: team.team_name, totalPts, playerBreakdown };
      });

      // 4. Write back total_points — best-effort; RLS only allows own row to succeed
      await Promise.allSettled(scores.map(s =>
        supabase.from('fantasy_league_teams')
          .update({ total_points: s.totalPts })
          .eq('id', s.leagueTeamId)
      ));

      setTeamScores(scores);
      setLastUpdated(new Date());
      setError(null);
    } catch (e) {
      setError(e.message ?? 'Scoring error');
    }
    setLoading(false);
  }, [leagueId]);

  useEffect(() => {
    setLoading(true);
    calculate();
    const id = setInterval(calculate, 5 * 60 * 1000); // refresh every 5 min
    return () => clearInterval(id);
  }, [calculate]);

  return { teamScores, loading, error, lastUpdated, refresh: calculate };
}
