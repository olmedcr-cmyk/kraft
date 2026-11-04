import type { Countdown } from '@/alta/model';

/** «3·2·1», «5 s», «10 s» o «sin cuenta». */
export const countdownLabel = (n: Countdown) => (n === 0 ? 'sin cuenta' : n === 3 ? '3·2·1' : `${n} s`);
