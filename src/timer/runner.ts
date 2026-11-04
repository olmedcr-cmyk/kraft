import { AppState, type NativeEventSubscription } from 'react-native';

import { setupFeedback, signal } from '@/platform/feedback';
import { getSettings } from '@/state/settings';
import {
  createTimer,
  cues,
  interrupt,
  next,
  pauseToggle,
  prev,
  primary,
  snapshot,
  start,
  stop,
  tick,
  type Plan,
  type Snapshot,
  type TimerState,
} from './engine';

const FRAME_MS = 200;

/**
 * Dueño del temporizador fuera de las pantallas: el tiempo sigue aunque se abra «¿Cómo se hace?».
 * Hace de reloj, emite las señales (sonido, vibración) y avisa a quien escuche.
 */
export class Runner {
  private state: TimerState;
  private snap: Snapshot;
  private subs = new Set<() => void>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private appSub: NativeEventSubscription | null = null;
  /** Momento real en que empezó y acabó (para el resumen). */
  startedAt: number | null = null;
  endedAt: number | null = null;

  constructor(plan: Plan) {
    this.state = createTimer(plan);
    this.snap = snapshot(this.state, Date.now());
  }

  subscribe = (f: () => void) => {
    this.subs.add(f);
    return () => {
      this.subs.delete(f);
    };
  };

  getSnapshot = () => this.snap;
  getState = () => this.state;

  setPlan(plan: Plan) {
    if (this.state.status === 'running') return;
    this.state = createTimer(plan);
    this.publish(Date.now(), false);
  }

  private publish(now: number, withCues = true) {
    const next = snapshot(this.state, now);
    if (withCues) for (const c of cues(this.snap, next)) signal(c);
    this.snap = next;
    if (this.state.status === 'running') this.ensureClock();
    else this.stopClock();
    if (this.state.status === 'done' && this.endedAt === null) this.endedAt = now;
    this.subs.forEach((f) => f());
  }

  private ensureClock() {
    if (this.timer) return;
    this.timer = setInterval(() => this.apply(tick), FRAME_MS);
    this.appSub = AppState.addEventListener('change', (st) => {
      if (st === 'active') this.apply(tick);
    });
  }

  private stopClock() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.appSub?.remove();
    this.appSub = null;
  }

  private apply = (fn: (s: TimerState, now: number) => TimerState) => {
    const now = Date.now();
    this.state = fn(this.state, now);
    this.publish(now);
  };

  start = () => {
    setupFeedback({ playInSilentMode: getSettings().silencio });
    this.startedAt = Date.now();
    this.endedAt = null;
    this.apply(start);
  };
  primary = () => {
    if (this.state.status !== 'running') {
      setupFeedback({ playInSilentMode: getSettings().silencio });
      this.startedAt = Date.now();
      this.endedAt = null;
    }
    this.apply(primary);
  };
  pause = () => this.apply(pauseToggle);
  prev = () => this.apply(prev);
  next = () => this.apply(next);
  stop = () => this.apply(stop);
  interrupt = () => this.apply(interrupt);
  /** Saltar a un tramo concreto (empezar la sesión por un bloque). */
  startAt = (index: number) => {
    setupFeedback({ playInSilentMode: getSettings().silencio });
    this.startedAt = Date.now();
    this.endedAt = null;
    this.apply((s, now) => ({ ...start(s, now), index: Math.max(0, Math.min(index, s.plan.length - 1)) }));
  };
  reset = () => {
    this.state = createTimer(this.state.plan);
    this.startedAt = null;
    this.endedAt = null;
    this.publish(Date.now(), false);
  };
  dispose() {
    this.stopClock();
    this.subs.clear();
  }
}
