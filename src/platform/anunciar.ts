/**
 * Decir algo al lector de pantalla (VoiceOver, TalkBack, lectores en web) sin moverle el foco.
 * Solo para cambios que importan: fase del temporizador, errores. Nunca cada segundo.
 */
import { AccessibilityInfo, Platform } from 'react-native';

let region: HTMLElement | null = null;

/** En web, react-native-web no anuncia nada: una región aria-live oculta hace de altavoz. */
function webRegion() {
  if (region || typeof document === 'undefined') return region;
  region = document.createElement('div');
  region.setAttribute('aria-live', 'assertive');
  region.setAttribute('aria-atomic', 'true');
  Object.assign(region.style, {
    position: 'absolute',
    width: '1px',
    height: '1px',
    overflow: 'hidden',
    clip: 'rect(0 0 0 0)',
    whiteSpace: 'nowrap',
  });
  document.body.appendChild(region);
  return region;
}

export function anunciar(msg: string) {
  if (!msg) return;
  if (Platform.OS === 'web') {
    const r = webRegion();
    if (!r) return;
    // Vaciar y volver a poner: así se repite aunque el texto sea el mismo de antes.
    r.textContent = '';
    setTimeout(() => {
      r.textContent = msg;
    }, 50);
    return;
  }
  AccessibilityInfo.announceForAccessibility(msg);
}
