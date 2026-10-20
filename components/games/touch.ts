// Detección de puntero táctil para useSyncExternalStore
const COARSE_QUERY = "(pointer: coarse)";

function getQuery(): MediaQueryList | null {
  try {
    return window.matchMedia(COARSE_QUERY);
  } catch {
    return null;
  }
}

export function subscribeCoarse(cb: () => void): () => void {
  const mql = getQuery();
  if (!mql) return () => {};
  mql.addEventListener("change", cb);
  return () => mql.removeEventListener("change", cb);
}

export function getCoarseSnapshot(): boolean {
  return getQuery()?.matches ?? false;
}

// Sin matchMedia en SSR: se comporta como escritorio
export function getServerCoarseSnapshot(): boolean {
  return false;
}
