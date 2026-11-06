/**
 * Legal (KL1–KL5). Lógica pura: qué tienes guardado, el CSV de tus datos, lo pendiente y el borrado.
 * El texto legal definitivo lo da el abogado; aquí solo hay el resumen en corto.
 */
import type { Settings } from '@/alta/model';
import { bill, monthKey, monthStatus, type DiaryState } from '@/diario/model';

/** El borrado se hace a los 30 días: hasta entonces puedes volver. */
export const DELETE_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export const deletionDate = (requestedAt: number) => requestedAt + DELETE_DAYS * DAY_MS;

/** Lo que tienes guardado, en cifras. */
export function dataCounts(s: DiaryState) {
  const days = Object.values(s.days);
  return {
    sesiones: days.filter((d) => (d.own?.minutes ?? 0) > 0).length,
    clases: days.filter((d) => d.class).length,
    pagos: Object.keys(s.payments).length,
  };
}

/** Meses cerrados sin pagar y su total. Antes de borrar la cuenta conviene saldarlos. */
export function pendingPayments(s: DiaryState, now: number) {
  const months = new Set<string>();
  for (const d of Object.values(s.days)) months.add(d.day.slice(0, 7));
  const due = [...months].filter((m) => m < monthKey(now) && monthStatus(s, m, now) === 'a-pagar').sort();
  return { months: due, amount: due.reduce((a, m) => a + bill(s, m).amount, 0) };
}

/** Un campo CSV: entre comillas si lleva separador, comillas o salto de línea. */
export function csvField(v: unknown): string {
  const t = v === undefined || v === null ? '' : String(v);
  return /[",\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
}

const row = (cells: unknown[]) => cells.map(csvField).join(',');

/**
 * Todos tus datos en un CSV (portabilidad, RGPD art. 20): un bloque por tipo,
 * con su propia cabecera, separados por una línea en blanco.
 */
export function exportCsv(s: DiaryState, settings: Settings, now: number): string {
  const out: string[] = [];
  out.push(row(['# KRAFT · tus datos', new Date(now).toISOString()]));
  out.push('');

  out.push(row(['perfil', 'valor']));
  out.push(row(['nombre', settings.nombre]));
  out.push(row(['entrenador', settings.coach ? `${settings.coach.name} (${settings.coach.code})` : '']));
  out.push(row(['aceptado', settings.acceptedAt ? new Date(settings.acceptedAt).toISOString() : '']));
  out.push(row(['comparte esfuerzo y notas con el entrenador', settings.compartir ? 'sí' : 'no']));
  out.push(row(['analítica', settings.analitica ? 'sí' : 'no']));
  out.push(row(['emails', settings.emails ? 'sí' : 'no']));
  out.push(row(['salud', settings.salud ? 'sí' : 'no']));
  out.push('');

  out.push(row(['dia', 'clase', 'minutos de clase', 'cancelada tarde', 'minutos por tu cuenta', 'tabatas']));
  for (const d of Object.values(s.days).sort((a, b) => a.day.localeCompare(b.day))) {
    out.push(row([d.day, d.class?.mode ?? '', d.class?.minutes ?? '', d.class?.late ? 'sí' : '', d.own?.minutes ?? '', d.own?.tabatas ?? '']));
  }
  out.push('');

  out.push(row(['mes', 'importe (€)', 'método', 'pagado']));
  for (const p of Object.values(s.payments).sort((a, b) => a.month.localeCompare(b.month))) {
    out.push(row([p.month, p.amount, p.method, new Date(p.at).toISOString()]));
  }
  return out.join('\n') + '\n';
}

// ─── Documentos (KL5) ──────────────────────────────────────────────────────

export type DocId = 'privacidad' | 'terminos' | 'aviso';

export interface LegalDoc {
  title: string;
  /** Resumen en corto (tarjeta Klein). */
  short: string;
  sections: { title: string; body: string }[];
}

/** Lo que aún falta: lo rellena el abogado. */
export const PENDING = '[PENDIENTE DE ABOGADO]';
export const RESPONSIBLE = '[RAZÓN SOCIAL · NIF · DIRECCIÓN]';
export const VERSION = 'Versión 1 · [FECHA]';

/** Resúmenes en lenguaje llano (borrador). El texto completo que manda es el del abogado. */
export function legalDoc(id: DocId, coach = 'tu entrenador'): LegalDoc {
  switch (id) {
    case 'privacidad':
      return {
        title: 'Privacidad',
        short: `Guardamos tus entrenos para contarlos. ${coach} los ve. No vendemos nada. Lo borras cuando quieras.`,
        sections: [
          { title: 'Qué datos', body: 'Tu nombre y email, tus entrenos (minutos, series, tabatas), tus clases y reservas, tus pagos y, si lo activas, el esfuerzo y las notas que dejas al acabar.' },
          { title: 'Para qué', body: 'Para que funcione: enseñarte la sesión, contar lo que haces, reservar y cobrarte las clases. Nada de publicidad.' },
          { title: 'Con quién', body: `Con ${coach}, que ve tus sesiones, esfuerzo, notas y pagos. Con quien nos ayuda a cobrar y a guardar los datos, solo lo necesario. Con nadie más.` },
          { title: 'Cuánto tiempo', body: 'Mientras tengas cuenta. Si la borras, todo se borra a los 30 días, salvo los recibos, que se guardan el tiempo que pide la ley.' },
          { title: 'Tus derechos', body: 'Ver, descargar, corregir y borrar tus datos, y oponerte a su uso. Lo haces desde Tú · Cuenta · Privacidad, o escribiéndonos. También puedes reclamar ante la AEPD.' },
          { title: 'Contacto', body: `Responsable: ${RESPONSIBLE}. Email: [EMAIL DE PRIVACIDAD].` },
        ],
      };
    case 'terminos':
      return {
        title: 'Términos',
        short: 'Usas KRAFT para entrenar con tu entrenador. Pagas sus clases, no la app. Tienes 14 años o más.',
        sections: [
          { title: 'Quién puede usarla', body: 'Personas de 14 años o más. Si eres menor de edad, con permiso de tu familia.' },
          { title: 'Qué hace la app', body: 'Te enseña la sesión que manda tu entrenador, te lleva el tiempo, reserva clases y te cobra las que haces.' },
          { title: 'Pagos', body: 'El precio de cada clase lo fija tu entrenador o tu centro. Un mes se paga cuando se cierra; vence el día 5 del siguiente.' },
          { title: 'Cancelar', body: 'Una clase se cancela gratis hasta 2 horas antes. Después, se cobra.' },
          { title: 'Tu salud', body: 'Entrena con cabeza. Si algo duele, para. La app no sustituye a un profesional sanitario.' },
          { title: 'Dejar la app', body: 'Puedes borrar tu cuenta cuando quieras desde Tú · Cuenta.' },
        ],
      };
    case 'aviso':
      return {
        title: 'Aviso legal',
        short: 'Quién está detrás de KRAFT y de quién son las ilustraciones y el código que usa.',
        sections: [
          { title: 'Titular', body: RESPONSIBLE },
          { title: 'Ilustraciones', body: 'Ejercicios de Workout Guide · Bryl Lim / Everkinetic, con licencia CC BY-SA 4.0.' },
          { title: 'Tipografía', body: 'Roboto Mono, de Google, con licencia Apache 2.0.' },
          { title: 'Código abierto', body: 'KRAFT usa React Native, Expo y otras librerías de código abierto, cada una con su licencia.' },
        ],
      };
  }
}

export const isDocId = (v: unknown): v is DocId => v === 'privacidad' || v === 'terminos' || v === 'aviso';
