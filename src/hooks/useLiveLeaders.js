import { useState, useEffect, useRef, useCallback } from 'react';

export function useLiveLeaders() {
  const [leaders, setLeaders]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [isLive,  setIsLive]    = useState(false); // true when scores are live
  const cancelRef = useRef(false);

  const load = useCallback(async () => {
    try {
      const res  = await fetch('/api/leaders');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!cancelRef.current) setLeaders(json.leaders ?? []);
    } catch (e) {
      console.warn('Leaders fetch failed:', e.message);
    } finally {
      if (!cancelRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    cancelRef.current = false;
    load();

    // Poll every 2 min when live (goals update mid-game), every 10 min otherwise
    const interval = isLive ? 2 * 60 * 1000 : 10 * 60 * 1000;
    const id = setInterval(load, interval);
    return () => {
      cancelRef.current = true;
      clearInterval(id);
    };
  }, [load, isLive]);

  // Called by Dashboard when any score goes live
  const setLiveMode = useCallback((live) => setIsLive(live), []);

  // Called by Dashboard immediately when a game ends
  const refresh = useCallback(() => { load(); }, [load]);

  return { leaders, loading, refresh, setLiveMode };
}
