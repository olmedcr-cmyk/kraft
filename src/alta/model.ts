/**
 * Primera vez (R1). Lógica pura: código del entrenador y ajustes del alta.
 */

/** Código de entrenador: 6 cifras. */
export const CODE_LEN = 6;

export interface Coach {
  code: string;
  name: string;
  initial: string;
  modes: ('grupo' | 'solo' | 'online')[];
}

/** Directorio de ejemplo hasta tener backend. */
const DIRECTORY: Record<string, Omit<Coach, 'code'>> = {
  '472913': { name: 'Elena', initial: 'E', modes: ['grupo', 'solo', 'online'] },
};

export const findCoach = (code: string): Coach | undefined =>
  code.length === CODE_LEN && DIRECTORY[code] ? { code, ...DIRECTORY[code] } : undefined;

export const typeDigit = (code: string, d: string) => (code.length < CODE_LEN && /^\d$/.test(d) ? code + d : code);
export const backspace = (code: string) => code.slice(0, -1);

/**
 * Lo pegado puede ser el código («472 913») o el enlace del entrenador
 * («https://kraft.app/e/472913», «kraft://entrenador/472913»). Se quedan las 6 últimas cifras seguidas.
 */
export function pasteCode(text: string): string | undefined {
  const runs = text.match(/\d[\d\s-]*\d|\d/g) ?? [];
  for (let i = runs.length - 1; i >= 0; i--) {
    const digits = runs[i].replace(/\D/g, '');
    if (digits.length === CODE_LEN) return digits;
  }
  return undefined;
}

// ─── Ajustes ───────────────────────────────────────────────────────────────

export interface Settings {
  /** Alta terminada: se entra directo a Hoy. */
  onboarded: boolean;
  /** Aceptó términos y privacidad y confirmó 14 años o más (fecha). */
  acceptedAt?: number;
  coach?: Coach;
  /** Avisos (cuando llega tu sesión, recordatorios de clase). */
  avisos: boolean;
  /** Que el 3·2·1 suene con el móvil en silencio. */
  silencio: boolean;
  /** Pantalla encendida mientras entrenas. */
  pantalla: boolean;
  /** RGPD: apagados por defecto, solo se encienden en Tú. */
  analitica: boolean;
  emails: boolean;
  /** Esfuerzo y notas al entrenador (KL1). Las sesiones y los pagos los ve siempre: es para lo que está. */
  compartir: boolean;
  /** Pidió borrar la cuenta (fecha). Se borra a los 30 días; si vuelve antes, se anula. */
  borradoPedido?: number;
  /** Nombre del atleta (lo dará la cuenta). */
  nombre: string;

  // ─── Entreno (KT2) ───
  /** Segundos de cuenta atrás antes de cada tramo; 0 = sin 3·2·1. */
  cuentaAtras: Countdown;
  /** Al acabar un tramo o bloque de la sesión: tocar para seguir, o seguir solo. */
  descanso: 'manual' | 'auto';
  /** Tocar el número (palma) pausa. */
  palmaPausa: boolean;
  peso: 'kg' | 'lb';

  // ─── Sonido (KT3) ───
  /** Volumen de los pitidos, 0–10. */
  volumen: number;
  /** Voz «tres, dos, uno» además de los pitidos. */
  voz: boolean;
  vibrar: boolean;
  /** Bajar la música (si no, suena encima). */
  bajarMusica: boolean;

  // ─── Avisos (KT4) ───
  /** Horas antes de clase. */
  avisoAntes: 1 | 3;
  avisoEspera: boolean;
  avisoPago: boolean;
  resumen: boolean;

  // ─── Cuenta (KT6) ───
  /** Salud: consentimiento propio (RGPD). Solo escribe entrenos y calorías. */
  salud: boolean;
}

export const COUNTDOWNS = [0, 3, 5, 10] as const;
export type Countdown = (typeof COUNTDOWNS)[number];

export const DEFAULT_SETTINGS: Settings = {
  onboarded: false,
  avisos: true,
  silencio: true,
  pantalla: true,
  analitica: false,
  emails: false,
  compartir: true,
  nombre: '',
  cuentaAtras: 3,
  descanso: 'manual',
  palmaPausa: true,
  peso: 'kg',
  volumen: 6,
  // CLAUDE.md fija 3 pitidos; la voz es un extra que se enciende en Tú.
  voz: false,
  vibrar: true,
  bajarMusica: true,
  avisoAntes: 1,
  avisoEspera: true,
  avisoPago: true,
  resumen: false,
  // Datos de salud: solo con consentimiento explícito.
  salud: false,
};

/** Valores permitidos de los ajustes que no son sí/no. */
const ENUMS: Partial<Record<keyof Settings, readonly unknown[]>> = {
  cuentaAtras: COUNTDOWNS,
  descanso: ['manual', 'auto'],
  peso: ['kg', 'lb'],
  avisoAntes: [1, 3],
  volumen: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
};

/** Lo guardado se mezcla con los valores por defecto (campos nuevos en versiones nuevas). */
export function restore(saved: unknown): Settings {
  if (!saved || typeof saved !== 'object') return DEFAULT_SETTINGS;
  const s = saved as Partial<Settings>;
  const out: Settings = { ...DEFAULT_SETTINGS };
  for (const k of Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]) {
    const ok = ENUMS[k] ? ENUMS[k]!.includes(s[k]) : typeof s[k] === typeof DEFAULT_SETTINGS[k];
    if (ok) (out as unknown as Record<string, unknown>)[k] = s[k];
  }
  if (typeof s.acceptedAt === 'number') out.acceptedAt = s.acceptedAt;
  if (typeof s.borradoPedido === 'number') out.borradoPedido = s.borradoPedido;
  if (s.coach && typeof s.coach.code === 'string' && typeof s.coach.name === 'string') out.coach = s.coach;
  return out;
}
