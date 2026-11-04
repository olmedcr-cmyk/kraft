import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useEffect, useState, useSyncExternalStore } from 'react';

import type { Plan } from './engine';
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
    activateKeepAwakeAsync(TAG)
      .then(() => {
        on = true;
        if (gone) release();
      })
      .catch(() => {});
    return () => {
      gone = true;
      if (on) release();
    };
  }, []);
  return null;
}

/** Escucha un Runner desde React. */
export function useRunner(runner: Runner) {
  const snap = useSyncExternalStore(runner.subscribe, runner.getSnapshot, runner.getSnapshot);
  const running = runner.getState().status === 'running';
  return {
    snap,
    running,
    keepAwake: running ? KeepAwake : null,
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
