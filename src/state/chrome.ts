import { useEffect, useSyncExternalStore } from 'react';

/** Navegación oculta en marcha. Una pantalla en marcha llama a useHideNav(true). */
let hidden = false;
const subs = new Set<() => void>();

function set(v: boolean) {
  if (hidden === v) return;
  hidden = v;
  subs.forEach((f) => f());
}

export function useNavHidden() {
  return useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => subs.delete(f);
    },
    () => hidden,
    () => hidden,
  );
}

export function useHideNav(hide: boolean) {
  useEffect(() => {
    set(hide);
    return () => set(false);
  }, [hide]);
}
