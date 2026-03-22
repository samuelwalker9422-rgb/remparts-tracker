import { useState, useEffect } from 'react';

export function useRempartsSchedule() {
  const [schedule,      setSchedule]      = useState([]);
  const [playoffGames,  setPlayoffGames]  = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch('/api/games');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled) {
          setSchedule(json.games ?? []);
          setPlayoffGames(json.playoffGames ?? []);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { schedule, playoffGames, loading, error };
}
