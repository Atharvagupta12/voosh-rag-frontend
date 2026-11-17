import { useEffect, useState } from "react";
import { getMeta } from "../lib/api.js";

/** Index metadata (article count, outlets, latest headlines). Also wakes a sleeping backend. */
export function useMeta() {
  const [state, setState] = useState({ meta: null, error: null, loading: true });

  useEffect(() => {
    const ctrl = new AbortController();
    getMeta(ctrl.signal)
      .then((meta) => setState({ meta, error: null, loading: false }))
      .catch((error) => {
        if (!ctrl.signal.aborted) setState({ meta: null, error, loading: false });
      });
    return () => ctrl.abort();
  }, []);

  return state;
}
