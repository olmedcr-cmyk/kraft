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
}

export const DEFAULT_SETTINGS: Settings = {
  onboarded: false,
  avisos: true,
  silencio: true,
  pantalla: true,
  analitica: false,
  emails: false,
};

/** Lo guardado se mezcla con los valores por defecto (campos nuevos en versiones nuevas). */
export function restore(saved: unknown): Settings {
  if (!saved || typeof saved !== 'object') return DEFAULT_SETTINGS;
  const s = saved as Partial<Settings>;
  const out: Settings = { ...DEFAULT_SETTINGS };
  for (const k of Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]) {
    if (typeof s[k] === typeof DEFAULT_SETTINGS[k]) (out as unknown as Record<string, unknown>)[k] = s[k];
  }
  if (typeof s.acceptedAt === 'number') out.acceptedAt = s.acceptedAt;
  if (s.coach && typeof s.coach.code === 'string' && typeof s.coach.name === 'string') out.coach = s.coach;
  return out;
}
