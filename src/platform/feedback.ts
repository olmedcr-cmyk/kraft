/**
 * Sonido y vibración del temporizador.
 * 3 pitidos cortos en el 3·2·1; largo al empezar y acabar tramo.
 * Vibración corta / larga / doble. La música baja (duck), no se para.
 * Suena en silencio solo si el usuario lo activa (KT3Sound).
 */
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';

import type { Cue } from '@/timer/engine';

let corto: AudioPlayer | null = null;
let largo: AudioPlayer | null = null;
let ready = false;

export async function setupFeedback({ playInSilentMode = false } = {}) {
  try {
    await setAudioModeAsync({
      playsInSilentMode: playInSilentMode,
      interruptionMode: 'duckOthers',
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
  if (!p) return;
  try {
    p.seekTo(0);
    p.play();
  } catch {
    // Sin audio disponible: la vibración y la pantalla siguen informando.
  }
}

async function vibrate(kind: 'corta' | 'larga' | 'doble') {
  try {
    if (kind === 'corta') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    else if (kind === 'larga') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    else await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // Sin motor de vibración (web).
  }
}

export function signal(cue: Cue) {
  switch (cue) {
    case 'count':
      play(corto);
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
