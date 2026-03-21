import { useState, useEffect, useRef, useCallback } from 'react';

export function useStandings() {
  const [east,    setEast]    = useState([]);
  const [west,    setWest]    = useState([]);
  const [loading, setLoading] = useState(true);
  const cancelRef = useRef(false);

  const load = useCallback(async () => {
    try {
      const res  = await fetch('/api/standings');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!cancelRef.current) {
        setEast(json.east ?? []);
        setWest(json.west ?? []);
      }
    } catch (e) {
      console.warn('Standings fetch failed:', e.message);
    } finally {
      if (!cancelRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    cancelRef.current = false;
    load();

    // Base safety poll every 5 minutes (game-end events trigger immediate refreshes)
    const id = setInterval(load, 5 * 60 * 1000);
    return () => {
      cancelRef.current = true;
      clearInterval(id);
    };
  }, [load]);

  // Exposed so Dashboard can call this immediately when a game ends
  const refresh = useCallback(() => { load(); }, [load]);

  return { east, west, loading, refresh };
}
