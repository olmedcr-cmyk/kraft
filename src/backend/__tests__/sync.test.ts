jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

import { DEFAULT_SETTINGS } from '@/alta/model';
import { newId, profilePatch } from '../sync';

describe('sincronización', () => {
  it('solo sube los ajustes que viven en el servidor', () => {
    const a = { ...DEFAULT_SETTINGS };
    expect(profilePatch(a, { ...a, volumen: 2, peso: 'lb' })).toBeNull();
    expect(profilePatch(a, { ...a, analitica: true, compartir: false, nombre: 'Ana' })).toEqual({ analytics: true, share_effort: false, name: 'Ana' });
    expect(profilePatch(a, { ...a, acceptedAt: Date.UTC(2026, 10, 6) })).toEqual({ accepted_at: '2026-11-06T00:00:00.000Z' });
  });

  it('ids únicos con forma de uuid', () => {
    const a = newId();
    expect(a).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    expect(newId()).not.toBe(a);
  });
});
