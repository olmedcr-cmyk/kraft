import { authErrorText, isEmail, maskEmail, normalizeEmail } from '../email';

describe('email', () => {
  it('normaliza y valida', () => {
    expect(normalizeEmail('  Ana@Gmail.COM ')).toBe('ana@gmail.com');
    expect(isEmail('ana@gmail.com')).toBe(true);
    expect(isEmail('ana@gmail')).toBe(false);
    expect(isEmail('ana gmail.com')).toBe(false);
    expect(isEmail('@gmail.com')).toBe(false);
  });

  it('enmascara sin escribir la dirección entera', () => {
    expect(maskEmail('ana.garcia@gmail.com')).toBe('a•••@gmail.com');
  });

  it('errores en palabras del atleta', () => {
    expect(authErrorText({ status: 429, message: 'Too many' })).toBe('Demasiados intentos. Espera un minuto');
    expect(authErrorText({ message: 'Token has expired or is invalid' })).toBe('Ese código no vale o ha caducado');
    expect(authErrorText({ message: 'Failed to fetch' })).toBe('Sin conexión. Prueba otra vez');
    expect(authErrorText(null)).toBe('No ha funcionado. Prueba otra vez');
  });
});
