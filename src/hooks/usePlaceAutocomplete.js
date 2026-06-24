import { useState, useEffect, useRef } from 'react';

export function usePlaceAutocomplete(query, delay = 300) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading]         = useState(false);
  const timerRef                      = useRef(null);
  const abortRef                      = useRef(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    timerRef.current = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();

      try {
        const res = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5&lang=en`,
          { signal: abortRef.current.signal }
        );
        const data = await res.json();

        const results = (data.features || []).map((f) => {
          const p = f.properties;
          const parts = [p.name, p.city || p.county, p.state, p.country]
            .filter(Boolean)
            .filter((v, i, arr) => arr.indexOf(v) === i);
          return {
            label: parts.slice(0, 3).join(', '),
            name:  p.name || parts[0],
            lat:   f.geometry.coordinates[1],
            lng:   f.geometry.coordinates[0],
          };
        });

        setSuggestions(results);
      } catch (err) {
        if (err.name !== 'AbortError') setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, delay]);

  return { suggestions, loading };
}