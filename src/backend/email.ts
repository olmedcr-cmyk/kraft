/** Email y código de acceso. Lógica pura. */

/** Largo del código que manda Supabase (supabase/config.toml: otp_length). */
export const OTP_LEN = 6;
/** Segundos antes de poder pedir otro código. */
export const RESEND_S = 60;

export const normalizeEmail = (s: string) => s.trim().toLowerCase();

/** Lo justo para no mandar códigos a direcciones imposibles; el servidor decide el resto. */
export const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizeEmail(s)) && normalizeEmail(s).length <= 254;

/** «ana.garcia@gmail.com» → «a•••@gmail.com», para enseñar a dónde se mandó sin escribirlo entero. */
export function maskEmail(s: string) {
  const e = normalizeEmail(s);
  const at = e.indexOf('@');
  if (at < 1) return e;
  return `${e[0]}•••${e.slice(at)}`;
}

/** Mensaje para el atleta según lo que diga el servidor. */
export function authErrorText(err: { message?: string; status?: number; code?: string } | null | undefined): string {
  const m = `${err?.code ?? ''} ${err?.message ?? ''}`.toLowerCase();
  if (err?.status === 429 || m.includes('rate') || m.includes('security purposes')) return 'Demasiados intentos. Espera un minuto';
  if (m.includes('expired') || m.includes('invalid') || m.includes('otp')) return 'Ese código no vale o ha caducado';
  if (m.includes('fetch') || m.includes('network')) return 'Sin conexión. Prueba otra vez';
  return 'No ha funcionado. Prueba otra vez';
}
