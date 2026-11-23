import { DEFAULT_SETTINGS } from '@/alta/model';
import type { DiaryState } from '@/diario/model';
import { csvField, dataCounts, deletionDate, exportCsv, isDocId, legalDoc, pendingPayments, serverCsv } from '../model';

const NOW = new Date(2026, 10, 6, 12).getTime(); // 6 nov 2026

const diary: DiaryState = {
  days: {
    '2026-09-01': { day: '2026-09-01', class: { mode: 'grupo', minutes: 50 } },
    '2026-10-07': { day: '2026-10-07', class: { mode: 'grupo', minutes: 50 }, own: { minutes: 20, tabatas: 1 } },
    '2026-10-11': { day: '2026-10-11', class: { mode: 'solo', minutes: 0, late: true } },
    '2026-11-03': { day: '2026-11-03', class: { mode: 'grupo', minutes: 50 } },
    '2026-11-04': { day: '2026-11-04', own: { minutes: 30, tabatas: 0 } },
  },
  payments: { '2026-09': { month: '2026-09', amount: 8, method: 'bizum', at: new Date(2026, 9, 2).getTime() } },
};

describe('legal', () => {
  it('borra a los 30 días', () => {
    expect(deletionDate(NOW) - NOW).toBe(30 * 24 * 60 * 60 * 1000);
  });

  it('cuenta sesiones propias, clases y pagos', () => {
    expect(dataCounts(diary)).toEqual({ sesiones: 2, clases: 4, pagos: 1 });
  });

  it('pendiente: solo meses cerrados sin pagar', () => {
    // Octubre: 1 grupo (8) + 1 solo cancelada tarde (30). Noviembre está en curso; septiembre pagado.
    expect(pendingPayments(diary, NOW)).toEqual({ months: ['2026-10'], amount: 38 });
  });

  it('campo CSV con comas y comillas', () => {
    expect(csvField('a')).toBe('a');
    expect(csvField('Elena, la "jefa"')).toBe('"Elena, la ""jefa"""');
    expect(csvField(undefined)).toBe('');
    expect(csvField(0)).toBe('0');
  });

  it('CSV con perfil, días ordenados y pagos', () => {
    const csv = exportCsv(diary, { ...DEFAULT_SETTINGS, nombre: 'Cris, O.', coach: { code: '472913', name: 'Elena', initial: 'E', modes: ['grupo'] } }, NOW);
    const lines = csv.trim().split('\n');
    expect(lines).toContain('nombre,"Cris, O."');
    expect(lines).toContain('entrenador,Elena (472913)');
    expect(lines).toContain('analítica,no');
    const days = lines.filter((l) => /^2026-\d\d-\d\d,/.test(l));
    expect(days.map((l) => l.slice(0, 10))).toEqual(['2026-09-01', '2026-10-07', '2026-10-11', '2026-11-03', '2026-11-04']);
    expect(lines).toContain('2026-10-11,solo,0,sí,,');
    expect(lines).toContain('2026-11-04,,,,30,0');
    expect(lines.some((l) => l.startsWith('2026-09,8,bizum,'))).toBe(true);
  });

  it('documentos con el entrenador en el resumen', () => {
    expect(legalDoc('privacidad', 'Elena').short).toContain('Elena los ve');
    expect(legalDoc('privacidad').sections).toHaveLength(6);
    expect(isDocId('terminos')).toBe(true);
    expect(isDocId('datos')).toBe(false);
  });
});

describe('serverCsv', () => {
  it('un bloque por tipo con cabecera de campos, y los objetos como campo/valor', () => {
    const csv = serverCsv(
      {
        exported_at: '2026-11-23T10:00:00Z',
        profile: { email: 'ana@ejemplo.com', name: 'Ana' },
        bookings: [
          { class: 'Fuerza', status: 'confirmed' },
          { class: 'Core, suave', status: 'waitlist', arrived_at: null },
        ],
        workouts: [],
      },
      Date.UTC(2026, 10, 23),
    );
    const lines = csv.split('\n');
    expect(lines).toContain('# profile');
    expect(lines).toContain('email,ana@ejemplo.com');
    expect(lines).toContain('# bookings');
    expect(lines).toContain('class,status,arrived_at');
    expect(lines).toContain('"Core, suave",waitlist,');
    expect(lines).toContain('(vacío)');
    expect(csv).not.toContain('exported_at');
  });
});
