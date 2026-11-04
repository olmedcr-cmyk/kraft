import type { Session } from '@/session/types';

/** Relleno de ejemplo (Elena, martes 50'). Se sustituye por la sesión real del entrenador. */
export const SAMPLE_SESSION: Session = {
  id: 'demo-martes',
  date: '2026-11-03',
  coach: { name: 'Elena', initial: 'E' },
  minutes: 50,
  blocks: [
    {
      id: 'calentar',
      kind: 'interval',
      name: 'Calentar',
      tint: 'klein',
      minutes: 8,
      steps: [
        { label: 'Movilidad', seconds: 300, rest: 0 },
        { exercise: 'plank', label: 'Plancha', seconds: 30, rest: 0, hold: true },
        { exercise: 'side-plank', label: 'Izquierda', seconds: 30, rest: 0, hold: true },
        { exercise: 'side-plank', label: 'Derecha', seconds: 30, rest: 0, hold: true },
      ],
    },
    {
      id: 'tabata',
      kind: 'tabata',
      name: 'Tabata',
      tint: 'naranja',
      minutes: 24,
      isNew: true,
      work: 20,
      rest: 10,
      rounds: 8,
      sets: 6,
      setRest: 30,
      a: { exercise: 'bulgarian-split-squat', label: 'Búlgara', weight: 12.5 },
      b: { exercise: 'squat', label: 'Sentadilla iso', hold: true },
    },
    {
      id: 'fuerza',
      kind: 'ladder',
      name: 'Fuerza',
      tint: 'klein',
      minutes: 6,
      exercise: { label: 'Press banca' },
      steps: [
        { reps: 20, weight: null },
        { reps: 15, weight: 30 },
        { reps: 10, weight: 40 },
        { reps: 5, weight: 50 },
      ],
      after: [{ label: 'Búlgaras', detail: '2×16' }, { label: 'Dominadas' }, { label: 'Rodillo' }, { label: 'Ski', detail: 'cal' }],
    },
    {
      id: 'bici',
      kind: 'interval',
      name: 'Bici',
      tint: 'tinteNaranja',
      minutes: 4,
      steps: [
        { label: 'Bici fuerte', seconds: 40, rest: 20 },
        { label: 'Bici fuerte', seconds: 40, rest: 20 },
        { label: 'Bici fuerte', seconds: 40, rest: 20 },
        { label: 'Bici fuerte', seconds: 40, rest: 0 },
      ],
    },
    {
      id: 'estirar',
      kind: 'interval',
      name: 'Estirar',
      tint: 'verde',
      minutes: 8,
      steps: [{ label: 'Estirar · libre', seconds: 480, rest: 0 }],
    },
  ],
};

/** Semana de ejemplo para el resumen (puntos = bloques hechos por día, L…D). */
export const SAMPLE_WEEK = [5, 0, 0, 0, 0, 0, 0];
