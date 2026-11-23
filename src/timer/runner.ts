import { AppState, type NativeEventSubscription } from 'react-native';

import { programarAvisos, quitarAvisos } from '@/platform/avisosTramo';
import { setupFeedback, signal } from '@/platform/feedback';
import {
  createTimer,
  cues,
  bringForward,
  end,
  freeze,
  interrupt,
  next,
  pauseToggle,
  prev,
  primary,
  snapshot,
  start,
  stop,
  tick,
  upcomingChanges,
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
  /** Tramo por el que empezó (si se empezó por un bloque): lo de antes no cuenta como hecho. */
  firstIndex = 0;

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
    if (withCues) for (const c of cues(this.snap, next)) signal(c, next.n);
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
      if (st === 'active') {
        quitarAvisos();
        this.apply(tick);
      } else if (st === 'background') {
        // Pantalla bloqueada: el reloj se duerme; los cambios de tramo suenan como avisos.
        programarAvisos(upcomingChanges(this.state, Date.now()));
      }
    });
  }

  private stopClock() {
    if (this.timer) quitarAvisos();
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.appSub?.remove();
    this.appSub = null;
  }

  // Reloj de pared a propósito: performance.now() se para cuando el iPhone duerme con la pantalla
  // bloqueada, y entonces al volver no se pondría al día. Un cambio de hora a mitad es mucho más raro.
  private apply = (fn: (s: TimerState, now: number) => TimerState) => {
    const now = Date.now();
    this.state = fn(this.state, now);
    this.publish(now);
  };

  start = () => {
    setupFeedback();
    this.firstIndex = 0;
    this.startedAt = Date.now();
    this.endedAt = null;
    this.apply(start);
  };
  primary = () => {
    if (this.state.status !== 'running') {
      setupFeedback();
      this.firstIndex = 0;
      this.startedAt = Date.now();
      this.endedAt = null;
    }
    this.apply(primary);
  };
  pause = () => this.apply(pauseToggle);
  prev = () => this.apply(prev);
  next = () => this.apply(next);
  stop = () => this.apply(stop);
  /** Terminar aquí, esté o no en pausa (KC3 · «Terminar aquí»). */
  end = () => this.apply(end);
  interrupt = () => this.apply(interrupt);
  /** Otro ejercicio de repeticiones antes que el actual (KC8). */
  bringForward = (ref: number) => this.apply((s, now) => bringForward(s, ref, now));
  /** Marcha guardada al cerrarse la app (KC3): queda congelada donde se guardó; al seguir, 3·2·1. */
  restore = (state: TimerState, savedAt: number, startedAt: number | null) => {
    this.state = freeze(state, savedAt);
    this.startedAt = startedAt;
    this.endedAt = null;
    this.publish(Date.now(), false);
  };
  /** Saltar a un tramo concreto (empezar la sesión por un bloque). */
  startAt = (index: number) => {
    setupFeedback();
    this.firstIndex = Math.max(0, Math.min(index, this.state.plan.length - 1));
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
