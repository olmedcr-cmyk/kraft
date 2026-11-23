/**
 * Qué decir cuando el servidor rechaza algo que hiciste sin red (la clase se llenó, ya empezó…).
 * Lógica pura: el nombre de la clase se pide fuera.
 */
import type { Job } from './outbox';

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/** «la clase está llena» → «La clase está llena». */
const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

/** Mensajes técnicos de Postgres/PostgREST (en inglés): no le dicen nada al atleta. */
const TECHNICAL = /^(duplicate key|permission denied|new row|null value|invalid input|violates|relation|column|function|JWT|could not|syntax)/i;

export function rejectText(job: Job, slotName: (id: string) => string | undefined): string {
  const raw = job.error && !TECHNICAL.test(job.error) ? job.error : 'el servidor no lo aceptó';
  const why = cap(raw);
  const p = job.payload as Record<string, string>;
  const cls = (id: string) => slotName(id) ?? 'la clase';
  switch (job.kind) {
    case 'book':
      return `No se pudo reservar ${cls(p.slot)}. ${why}.`;
    case 'cancel':
      return `No se pudo cancelar ${cls(p.slot)}. ${why}.`;
    case 'move':
      return `No se pudo mover ${cls(p.from)}. ${why}.`;
    case 'arrive':
      return `No se apuntó tu llegada a ${cls(p.slot)}. ${why}.`;
    case 'autojoin':
      return `No se cambió la lista de espera de ${cls(p.slot)}. ${why}.`;
    case 'pay': {
      const m = /^\d{4}-(\d{2})$/.exec(p.month ?? '');
      return `No se apuntó el pago de ${m ? MONTHS[Number(m[1]) - 1] : 'ese mes'}. ${why}.`;
    }
    case 'deletion':
      return `No se pudo pedir el borrado de la cuenta. ${why}. Prueba otra vez desde Mis datos.`;
    case 'unlink':
      return `No se pudo dejar de entrenar con tu entrenador. ${why}.`;
    case 'workout':
      return `No se guardó un entreno en el servidor. ${why}.`;
    default:
      return `No se pudo guardar un cambio. ${why}.`;
  }
}
