/** El temporizador en palabras, para el lector de pantalla. Puro: sin React ni plataforma. */
import type { Snapshot } from './engine';

/** «1 minuto y 5 segundos», «30 segundos». */
export function duracion(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  const parts: string[] = [];
  if (m) parts.push(`${m} ${m === 1 ? 'minuto' : 'minutos'}`);
  if (s || !m) parts.push(`${s} ${s === 1 ? 'segundo' : 'segundos'}`);
  return parts.join(' y ');
}

/** «quedan 1 minuto y 5 segundos», «queda 1 segundo». */
export function quedan(sec: number) {
  const one = sec === 1 || sec === 60;
  return `${one ? 'queda' : 'quedan'} ${duracion(sec)}`;
}

/** Lo que se anuncia al cambiar de fase (nunca cada segundo). `null`: nada que decir. */
export function faseHablada(s: Snapshot): string | null {
  if (s.paused) return s.interrupted ? 'Pausa por llamada. Al seguir, 3, 2, 1' : 'En pausa';
  switch (s.phase) {
    case 'countdown':
      return 'Preparado';
    case 'work':
      return `Trabajo, ${duracion(s.duration)}`;
    case 'rest':
      return `Descanso, ${duracion(s.duration)}`;
    case 'wait':
      return 'Espera. Toca para seguir';
    case 'reps':
      return 'Repeticiones. Marca la serie al acabar';
    case 'done':
      return s.stopped ? 'Parado. Guardado lo que llevabas' : 'Hecho';
    default:
      return null;
  }
}
