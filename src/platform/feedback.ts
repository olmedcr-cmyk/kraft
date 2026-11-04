/**
 * Sonido y vibración del temporizador.
 * 3 pitidos cortos en el 3·2·1; largo al empezar y acabar tramo.
 * Vibración corta / larga / doble. La música baja (duck), no se para.
 * Suena en silencio solo si el usuario lo activa (KT3Sound).
 */
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';

import { getSettings } from '@/state/settings';
import type { Cue } from '@/timer/engine';

let corto: AudioPlayer | null = null;
let largo: AudioPlayer | null = null;
let ready = false;

/** Modo de audio según Tú · Sonido: sonar en silencio y bajar la música (o sonar encima). */
export async function setupFeedback({ playInSilentMode = getSettings().silencio } = {}) {
  try {
    await setAudioModeAsync({
      playsInSilentMode: playInSilentMode,
      interruptionMode: getSettings().bajarMusica ? 'duckOthers' : 'mixWithOthers',
      shouldPlayInBackground: true,
    });
  } catch {
    // Web y simuladores sin sesión de audio: seguimos sin modo.
  }
  if (!ready) {
    corto = createAudioPlayer(require('../../assets/sounds/corto.wav'));
    largo = createAudioPlayer(require('../../assets/sounds/largo.wav'));
    ready = true;
  }
}

function play(p: AudioPlayer | null) {
  const v = getSettings().volumen;
  if (!p || v === 0) return;
  try {
    p.volume = v / 10;
    p.seekTo(0);
    p.play();
  } catch {
    // Sin audio disponible: la vibración y la pantalla siguen informando.
  }
}

async function vibrate(kind: 'corta' | 'larga' | 'doble') {
  if (!getSettings().vibrar) return;
  try {
    if (kind === 'corta') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    else if (kind === 'larga') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    else await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // Sin motor de vibración (web).
  }
}

const WORDS: Record<number, string> = { 3: 'tres', 2: 'dos', 1: 'uno' };

/** Voz «tres, dos, uno» (Tú · Sonido). Nunca rompe la marcha si no hay voz. */
function say(n: number | undefined) {
  const w = n !== undefined ? WORDS[n] : undefined;
  if (!w || !getSettings().voz) return;
  try {
    Speech.stop();
    Speech.speak(w, { language: 'es-ES', rate: 1.1, volume: getSettings().volumen / 10 });
  } catch {
    // sin motor de voz
  }
}

/** `n`: el número del 3·2·1 que suena (para la voz). */
export function signal(cue: Cue, n?: number) {
  switch (cue) {
    case 'count':
      play(corto);
      say(n);
      vibrate('corta');
      break;
    case 'start':
    case 'end':
      play(largo);
      vibrate('larga');
      break;
    case 'finish':
      play(largo);
      vibrate('doble');
      break;
  }
}
