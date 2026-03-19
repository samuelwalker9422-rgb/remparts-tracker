import { useState, useEffect, useRef } from 'react';

// GameStatus codes from LeagueStat
// "1" = not started  "2" = live  "3" = intermission  "4" = final

function hasLiveGame(games) {
  return games.some(g => g.GameStatus === '2' || g.GameStatus === '3');
}

export function useLiveScores() {
  const [games, setGames]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const timerRef              = useRef(null);

  async function fetchScores() {
    try {
      const res  = await fetch('/api/scores');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const raw  = json?.SiteKit?.Scorebar ?? [];
      setGames(raw);
      setError(null);
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
      const interval = hasLiveGame(games) ? 30_000 : 120_000;
      timerRef.current = setTimeout(async () => {
        await fetchScores();
        schedule();
      }, interval);
    }

    schedule();
    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { games, loading, error };
}
