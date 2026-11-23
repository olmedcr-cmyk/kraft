import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

import { anunciar } from '@/platform/anunciar';
import { useSettings } from '@/state/settings';
import type { Plan, Snapshot } from './engine';
import { faseHablada } from './hablado';
import { Runner } from './runner';

const TAG = 'kraft-timer';

/** Pantalla encendida mientras corre. En web el bloqueo es asíncrono y puede fallar: nunca rompe la marcha. */
function KeepAwake() {
  useEffect(() => {
    let on = false;
    let gone = false;
    const release = () => {
      try {
        Promise.resolve(deactivateKeepAwake(TAG)).catch(() => {});
      } catch {
        // ya estaba suelto
      }
    };
    const activate = () =>
      activateKeepAwakeAsync(TAG)
        .then(() => {
          on = true;
          if (gone) release();
        })
        .catch(() => {});
    activate();
    // Web: el navegador suelta el bloqueo al ocultar la pestaña. Al volver, se pide otra vez.
    const onVisible = () => {
      if (!gone && document.visibilityState === 'visible') activate();
    };
    if (Platform.OS === 'web') document.addEventListener('visibilitychange', onVisible);
    return () => {
      gone = true;
      if (Platform.OS === 'web') document.removeEventListener('visibilitychange', onVisible);
      if (on) release();
    };
  }, []);
  return null;
}

/** Escucha un Runner desde React. */
export function useRunner(runner: Runner) {
  const snap = useSyncExternalStore(runner.subscribe, runner.getSnapshot, runner.getSnapshot);
  const running = runner.getState().status === 'running';
  const { pantalla } = useSettings();
  return {
    snap,
    running,
    keepAwake: running && pantalla ? KeepAwake : null,
    start: runner.start,
    primary: runner.primary,
    pause: runner.pause,
    prev: runner.prev,
    next: runner.next,
    stop: runner.stop,
    reset: runner.reset,
  };
}

/** Temporizador propio de una pantalla (R5 · entrenar libre). */
export function useTimer(plan: Plan) {
  const [runner] = useState(() => new Runner(plan));
  useEffect(() => runner.setPlan(plan), [runner, plan]);
  useEffect(() => () => runner.dispose(), [runner]);
  return useRunner(runner);
}

/** Cada cambio de fase (no cada segundo) se dice al lector de pantalla: trabajo, descanso, pausa, hecho. */
export function useAnunciarFase(s: Snapshot) {
  const key = `${s.phase}|${s.index}|${s.paused}`;
  useEffect(() => {
    const msg = faseHablada(s);
    if (msg) anunciar(msg);
    // Solo al cambiar de fase, tramo o pausa: `s` cambia cada segundo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
