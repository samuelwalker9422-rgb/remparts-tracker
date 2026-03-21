import { useState, useEffect } from 'react';

// Returns a map of { [game_id]: floHockeyUrl }
export function useGameLinks() {
  const [links, setLinks] = useState({});

  useEffect(() => {
    fetch('/api/schedule')
      .then(r => r.json())
      .then(json => {
        const map = {};
        for (const [id, floId] of Object.entries(json?.links ?? {})) {
          if (floId) map[id] = `https://www.flohockey.tv/events/${floId}`;
        }
        setLinks(map);
      })
      .catch(() => {}); // fail silently — links are a nice-to-have
  }, []);

  return links;
}
