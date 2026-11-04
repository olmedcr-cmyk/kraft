import type { ImageSourcePropType } from 'react-native';

/** Crédito obligatorio: debe verse en la app allí donde salgan las ilustraciones. */
export const ILLUSTRATION_CREDIT = 'Ilustración: Workout Guide · Bryl Lim / Everkinetic · CC BY-SA 4.0';

export interface Exercise {
  id: string;
  name: string;
  /** 3 fases del movimiento. */
  phases: [ImageSourcePropType, ImageSourcePropType, ImageSourcePropType];
  /** Claves de técnica (píldoras de ayuda). */
  cues: string[];
  /** Descripción para lectores de pantalla. */
  alt: string;
}

export const EXERCISES: Record<string, Exercise> = {
  plank: {
    id: 'plank',
    name: 'Plancha',
    phases: [
      require('../../assets/illustrations/plank-1.png'),
      require('../../assets/illustrations/plank-2.png'),
      require('../../assets/illustrations/plank-3.png'),
    ],
    cues: ['Codos bajo hombros', 'Cadera recta'],
    alt: 'Plancha sobre antebrazos: codos bajo los hombros, cuerpo en línea recta',
  },
  'side-plank': {
    id: 'side-plank',
    name: 'Plancha lateral',
    phases: [
      require('../../assets/illustrations/side-plank-1.png'),
      require('../../assets/illustrations/side-plank-2.png'),
      require('../../assets/illustrations/side-plank-3.png'),
    ],
    cues: ['Codo bajo hombro', 'Cadera alta'],
    alt: 'Plancha lateral: apoyo en un antebrazo, cuerpo de lado en línea recta',
  },
  'bulgarian-split-squat': {
    id: 'bulgarian-split-squat',
    name: 'Búlgara',
    phases: [
      require('../../assets/illustrations/bulgarian-split-squat-1.png'),
      require('../../assets/illustrations/bulgarian-split-squat-2.png'),
      require('../../assets/illustrations/bulgarian-split-squat-3.png'),
    ],
    cues: ['Pie atrás en el banco', 'Rodilla sobre el pie'],
    alt: 'Zancada búlgara: pie de atrás sobre un banco, bajar la rodilla hacia el suelo',
  },
  squat: {
    id: 'squat',
    name: 'Sentadilla',
    phases: [
      require('../../assets/illustrations/squat-1.png'),
      require('../../assets/illustrations/squat-2.png'),
      require('../../assets/illustrations/squat-3.png'),
    ],
    cues: ['Peso en talones', 'Pecho alto'],
    alt: 'Sentadilla: bajar la cadera atrás con el pecho alto',
  },
  'push-up': {
    id: 'push-up',
    name: 'Flexión',
    phases: [
      require('../../assets/illustrations/push-up-1.png'),
      require('../../assets/illustrations/push-up-2.png'),
      require('../../assets/illustrations/push-up-3.png'),
    ],
    cues: ['Manos bajo hombros', 'Cuerpo en bloque'],
    alt: 'Flexión: bajar el pecho al suelo con el cuerpo recto',
  },
  lunge: {
    id: 'lunge',
    name: 'Zancada',
    phases: [
      require('../../assets/illustrations/lunge-1.png'),
      require('../../assets/illustrations/lunge-2.png'),
      require('../../assets/illustrations/lunge-3.png'),
    ],
    cues: ['Paso largo', 'Tronco recto'],
    alt: 'Zancada: paso al frente y bajar la rodilla de atrás',
  },
  burpee: {
    id: 'burpee',
    name: 'Burpee',
    phases: [
      require('../../assets/illustrations/burpee-1.png'),
      require('../../assets/illustrations/burpee-2.png'),
      require('../../assets/illustrations/burpee-3.png'),
    ],
    cues: ['Pecho al suelo', 'Salta arriba'],
    alt: 'Burpee: al suelo, flexión y salto',
  },
  'mountain-climber': {
    id: 'mountain-climber',
    name: 'Escalador',
    phases: [
      require('../../assets/illustrations/mountain-climber-1.png'),
      require('../../assets/illustrations/mountain-climber-2.png'),
      require('../../assets/illustrations/mountain-climber-3.png'),
    ],
    cues: ['Manos bajo hombros', 'Rodillas al pecho'],
    alt: 'Escalador: en plancha alta, llevar rodillas al pecho alternando',
  },
  bridge: {
    id: 'bridge',
    name: 'Puente',
    phases: [
      require('../../assets/illustrations/bridge-1.png'),
      require('../../assets/illustrations/bridge-2.png'),
      require('../../assets/illustrations/bridge-3.png'),
    ],
    cues: ['Aprieta glúteo', 'Costillas abajo'],
    alt: 'Puente de glúteo: tumbado boca arriba, subir la cadera',
  },
};

export const exercise = (id?: string) => (id ? EXERCISES[id] : undefined);
