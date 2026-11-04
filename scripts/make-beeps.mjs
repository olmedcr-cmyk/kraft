// Genera los pitidos del temporizador (WAV mono 16 bit, 44,1 kHz).
// Corto: 3·2·1. Largo: empezar y acabar tramo.
import { writeFileSync } from 'node:fs';

function tone(file, ms, hz) {
  const rate = 44100, n = Math.round((rate * ms) / 1000), fade = Math.round(rate * 0.008);
  const buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(rate, 24); buf.writeUInt32LE(rate * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    const env = Math.min(1, i / fade, (n - i) / fade);
    buf.writeInt16LE(Math.round(Math.sin((2 * Math.PI * hz * i) / rate) * env * 0.6 * 32767), 44 + i * 2);
  }
  writeFileSync(file, buf);
}
tone(new URL('../assets/sounds/corto.wav', import.meta.url), 120, 1046);
tone(new URL('../assets/sounds/largo.wav', import.meta.url), 600, 1046);
