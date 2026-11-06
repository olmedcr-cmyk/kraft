import { isNetworkError } from '../red';

it('distingue errores de red de los del servidor', () => {
  expect(isNetworkError(new TypeError('Failed to fetch'))).toBe(true);
  expect(isNetworkError({ message: 'Network request failed' })).toBe(true);
  expect(isNetworkError({ message: 'la clase está llena' })).toBe(false);
});
