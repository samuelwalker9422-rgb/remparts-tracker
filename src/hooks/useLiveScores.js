import { useState, useEffect, useRef } from 'react';

// GameStatus codes from LeagueStat
// "1" = not started  "2" = live  "3" = intermission  "4" = final

function hasLiveGame(games) {
  return games.some(g => g.GameStatus === '2' || g.GameStatus === '3');
}

export function useLiveScores() {
  const [games,          setGames]          = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);
  const [lastFinishedAt, setLastFinishedAt] = useState(null); // bumped when any game → Final

  const timerRef   = useRef(null);
  const gamesRef   = useRef([]);  // always-fresh copy — avoids stale closure
  const statusRef  = useRef({}); // { [gameID]: GameStatus } — tracks previous statuses

  async function fetchScores() {
    try {
      const res  = await fetch('/api/scores');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const raw  = json?.SiteKit?.Scorebar ?? [];

      // Detect any game that just flipped to Final from a live/intermission state
      const prev = statusRef.current;
      let anyJustEnded = false;
      for (const g of raw) {
        const wasLive = prev[g.ID] === '2' || prev[g.ID] === '3';
        const nowFinal = g.GameStatus === '4';
        if (wasLive && nowFinal) anyJustEnded = true;
        prev[g.ID] = g.GameStatus;
      }

      gamesRef.current = raw;
      setGames(raw);
      setError(null);
      if (anyJustEnded) setLastFinishedAt(Date.now());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchScores();

    function schedule() {
      // Poll every 30 s when live, every 2 min otherwise
      const interval = hasLiveGame(gamesRef.current) ? 30_000 : 120_000;
      timerRef.current = setTimeout(async () => {
        await fetchScores();
        schedule();
      }, interval);
    }

    schedule();
    return () => clearTimeout(timerRef.current);
  }, []);

  return { games, loading, error, lastFinishedAt };
}
