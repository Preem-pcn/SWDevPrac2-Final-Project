"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Small data loader: runs `load` whenever `deps` change and exposes data/error/loading.
export function useLoad<T>(load: () => Promise<T>, deps: unknown[] = []) {
  const loadRef = useRef(load);
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const key = JSON.stringify(deps);

  useEffect(() => {
    loadRef.current = load;
  });

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setData(await loadRef.current());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload();
  }, [key, reload]);

  return { data, error, loading, reload, setData };
}
