import { DEFAULT_SETTINGS, backspace, findCoach, pasteCode, restore, typeDigit } from '../model';

describe('código del entrenador', () => {
  it('escribe hasta 6 cifras y borra', () => {
    let c = '';
    for (const d of '4729135') c = typeDigit(c, d);
    expect(c).toBe('472913');
    expect(typeDigit('47', 'x')).toBe('47');
    expect(backspace(c)).toBe('47291');
    expect(backspace('')).toBe('');
  });
  it('encuentra al entrenador solo con el código entero', () => {
    expect(findCoach('4729')).toBeUndefined();
    expect(findCoach('472913')?.name).toBe('Elena');
    expect(findCoach('000000')).toBeUndefined();
  });
  it('pegar: código suelto, con espacios o dentro del enlace', () => {
    expect(pasteCode('472913')).toBe('472913');
    expect(pasteCode('472 913')).toBe('472913');
    expect(pasteCode('https://kraft.app/e/472913')).toBe('472913');
    expect(pasteCode('kraft://entrenador/472913?x=2')).toBe('472913');
    expect(pasteCode('hola')).toBeUndefined();
    expect(pasteCode('12345')).toBeUndefined();
  });
});

describe('ajustes', () => {
  it('analítica y emails, apagados por defecto', () => {
    expect(DEFAULT_SETTINGS.analitica).toBe(false);
    expect(DEFAULT_SETTINGS.emails).toBe(false);
    expect(DEFAULT_SETTINGS.onboarded).toBe(false);
  });
  it('restaura lo guardado y rellena lo que falte', () => {
    expect(restore(null)).toEqual(DEFAULT_SETTINGS);
    const r = restore({ onboarded: true, silencio: false, avisos: 'sí', acceptedAt: 5, coach: { code: '472913', name: 'Elena', initial: 'E', modes: [] } });
    expect(r.onboarded).toBe(true);
    expect(r.silencio).toBe(false);
    expect(r.avisos).toBe(true); // tipo incorrecto → por defecto
    expect(r.acceptedAt).toBe(5);
    expect(r.coach?.name).toBe('Elena');
  });
  it('valida los ajustes con valores fijos', () => {
    const r = restore({ cuentaAtras: 7, descanso: 'auto', peso: 'st', volumen: 11, avisoAntes: 3, voz: true });
    expect(r.cuentaAtras).toBe(3);
    expect(r.descanso).toBe('auto');
    expect(r.peso).toBe('kg');
    expect(r.volumen).toBe(6);
    expect(r.avisoAntes).toBe(3);
    expect(r.voz).toBe(true);
  });
  it('salud y voz, apagadas por defecto', () => {
    expect(DEFAULT_SETTINGS.salud).toBe(false);
    expect(DEFAULT_SETTINGS.voz).toBe(false);
  });
});
