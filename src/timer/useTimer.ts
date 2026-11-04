import { useKeepAwake } from 'expo-keep-awake';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { setupFeedback, signal } from '@/platform/feedback';
import {
  createTimer,
  cues,
  next as nextT,
  pauseToggle,
  prev as prevT,
  primary as primaryT,
  snapshot,
  start as startT,
  stop as stopT,
  tick,
  type Plan,
  type TimerState,
} from './engine';

const FRAME_MS = 200;

function KeepAwake() {
  useKeepAwake('kraft-timer');
  return null;
}

/** Conecta el motor puro con el reloj, el sonido y la app. */
export function useTimer(plan: Plan) {
  const [state, setState] = useState<TimerState>(() => createTimer(plan));
  const [now, setNow] = useState(() => Date.now());
  const snap = snapshot(state, now);
  const last = useRef(snap);

  // Cambio de configuración en reposo → nuevo plan.
  useEffect(() => {
    setState((s) => (s.status === 'running' ? s : { ...createTimer(plan), status: 'select' }));
  }, [plan]);

  useEffect(() => {
    setupFeedback();
  }, []);

  const running = state.status === 'running';

  // Reloj: solo pinta. El tiempo real sale de Date.now(), no de contar ticks.
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const t = Date.now();
      setState((s) => tick(s, t));
      setNow(t);
    }, FRAME_MS);
    return () => clearInterval(id);
  }, [running]);

  // Al volver de segundo plano, ponerse al día de golpe.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') {
        const t = Date.now();
        setState((s) => tick(s, t));
        setNow(t);
      }
    });
    return () => sub.remove();
  }, []);

  // Señales al cambiar de número o de tramo.
  useEffect(() => {
    for (const c of cues(last.current, snap)) signal(c);
    last.current = snap;
  });

  const act = useCallback((fn: (s: TimerState, t: number) => TimerState) => {
    const t = Date.now();
    setState((s) => fn(s, t));
    setNow(t);
  }, []);

  return {
    snap,
    running,
    keepAwake: running ? KeepAwake : null,
    start: useCallback(() => act(startT), [act]),
    primary: useCallback(() => act(primaryT), [act]),
    pause: useCallback(() => act(pauseToggle), [act]),
    prev: useCallback(() => act(prevT), [act]),
    next: useCallback(() => act(nextT), [act]),
    stop: useCallback(() => act(stopT), [act]),
    reset: useCallback(() => setState((s) => createTimer(s.plan)), []),
  };
}
