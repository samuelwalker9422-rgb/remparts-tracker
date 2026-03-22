import { useState, useEffect, useRef, useCallback } from 'react';

export function usePlayoffSchedule() {
  const [games,   setGames]   = useState([]);
  const [loading, setLoading] = useState(true);
  const cancelRef = useRef(false);

  const load = useCallback(async () => {
    try {
      const res  = await fetch('/api/playoffs');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!cancelRef.current) setGames(json.games ?? []);
    } catch (e) {
      console.warn('Playoff schedule fetch failed:', e.message);
    } finally {
      if (!cancelRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    cancelRef.current = false;
    load();
    // Poll every 5 min so scores update when games finish
    const id = setInterval(load, 5 * 60 * 1000);
    return () => { cancelRef.current = true; clearInterval(id); };
  }, [load]);

  return { games, loading };
}
