import {
  bringForward,
  createTimer,
  end,
  freeze,
  cues,
  interrupt,
  next,
  pauseToggle,
  prev,
  primary,
  resume,
  seriesPlan,
  snapshot,
  start,
  stop,
  tabataPlan,
  tick,
  upcomingChanges,
  type TimerState,
} from '../engine';

const S = 1000;

/** Avanza el reloj y el motor como lo haría la app (tick cada segundo o tras volver de segundo plano). */
function at(state: TimerState, now: number) {
  const s = tick(state, now);
  return { s, v: snapshot(s, now) };
}

describe('planes', () => {
  it('series con descanso fijo: 3·2·1 antes de cada serie, sin descanso tras la última', () => {
    const plan = seriesPlan({ work: 30, rest: 15, rounds: 2 });
    expect(plan.map((p) => `${p.kind}:${p.duration}:${p.round}`)).toEqual([
      'countdown:3:1',
      'work:30:1',
      'rest:15:1',
      'countdown:3:2',
      'work:30:2',
    ]);
  });

  it('series con descanso manual usa espera', () => {
    const plan = seriesPlan({ work: 45, rest: 0, rounds: 2 });
    expect(plan.map((p) => p.kind)).toEqual(['countdown', 'work', 'wait', 'countdown', 'work']);
    expect(plan[2].duration).toBe(Infinity);
  });

  it('tabata: un solo 3·2·1 y rondas seguidas', () => {
    const plan = tabataPlan({ work: 20, rest: 10, rounds: 3 });
    expect(plan.map((p) => `${p.kind}:${p.round}`)).toEqual([
      'countdown:1',
      'work:1',
      'rest:1',
      'work:2',
      'rest:2',
      'work:3',
    ]);
  });
});

describe('recorrido completo', () => {
  it('elegir → 3·2·1 → trabajo → descanso → 3·2·1 … → hecho', () => {
    let s = createTimer(seriesPlan({ work: 5, rest: 2, rounds: 2 }));
    expect(snapshot(s, 0).phase).toBe('select');

    s = start(s, 0);
    let v = snapshot(s, 0);
    expect(v.phase).toBe('countdown');
    expect(v.n).toBe(3);

    ({ s, v } = at(s, 1 * S));
    expect(v.n).toBe(2);
    ({ s, v } = at(s, 3 * S));
    expect(v.phase).toBe('work');
    expect(v.n).toBe(5);
    expect(v.round).toBe(1);

    ({ s, v } = at(s, 8 * S));
    expect(v.phase).toBe('rest');
    expect(v.n).toBe(2);

    ({ s, v } = at(s, 10 * S));
    expect(v.phase).toBe('countdown');
    expect(v.round).toBe(2);

    ({ s, v } = at(s, 13 * S));
    expect(v.phase).toBe('work');

    ({ s, v } = at(s, 18 * S));
    expect(v.phase).toBe('done');
    expect(v.roundsDone).toBe(2);
    expect(v.stopped).toBe(false);
  });

  it('se pone al día de golpe al volver de segundo plano', () => {
    let s = start(createTimer(seriesPlan({ work: 5, rest: 2, rounds: 2 })), 0);
    const { v } = at(s, 11.5 * S); // 3 + 5 + 2 = 10 → 1,5 s dentro del 2.º 3·2·1
    expect(v.phase).toBe('countdown');
    expect(v.round).toBe(2);
    expect(v.n).toBe(2);
  });

  it('la espera manual no avanza sola y el central la pasa', () => {
    let s = start(createTimer(seriesPlan({ work: 5, rest: 0, rounds: 2 })), 0);
    let v;
    ({ s, v } = at(s, 8 * S));
    expect(v.phase).toBe('wait');
    ({ s, v } = at(s, 600 * S));
    expect(v.phase).toBe('wait');
    expect(v.waited).toBe(592);
    s = primary(s, 600 * S);
    v = snapshot(s, 600 * S);
    expect(v.phase).toBe('countdown');
    expect(v.round).toBe(2);
  });
});

describe('pausa y parar', () => {
  it('la pausa congela el tiempo y lo devuelve al seguir', () => {
    let s = start(createTimer(seriesPlan({ work: 10, rest: 5, rounds: 1 })), 0);
    s = tick(s, 5 * S); // trabajo, quedan 8
    s = pauseToggle(s, 5 * S);
    let v = snapshot(tick(s, 60 * S), 60 * S);
    expect(v.paused).toBe(true);
    expect(v.n).toBe(8);
    s = pauseToggle(s, 60 * S);
    v = snapshot(tick(s, 61 * S), 61 * S);
    expect(v.paused).toBe(false);
    expect(v.n).toBe(7);
  });

  it('también se pausa en la espera manual, y desde ahí se para', () => {
    let s = start(createTimer(seriesPlan({ work: 2, rest: 0, rounds: 2 })), 0);
    s = tick(s, 6 * S); // espera tras la serie 1
    expect(snapshot(s, 6 * S).phase).toBe('wait');
    s = pauseToggle(s, 6 * S);
    expect(snapshot(s, 20 * S).paused).toBe(true);
    s = stop(s, 20 * S);
    expect(snapshot(s, 20 * S).roundsDone).toBe(1);
  });

  it('se puede pausar en el 3·2·1', () => {
    let s = start(createTimer(seriesPlan({ work: 10, rest: 5, rounds: 1 })), 0);
    s = pauseToggle(s, 1 * S);
    expect(snapshot(tick(s, 30 * S), 30 * S).n).toBe(2);
  });

  it('parar solo funciona en pausa y guarda lo hecho', () => {
    let s = start(createTimer(seriesPlan({ work: 5, rest: 2, rounds: 3 })), 0);
    s = tick(s, 12 * S); // serie 2 en 3·2·1 → 1 serie hecha
    expect(stop(s, 12 * S)).toBe(s); // sin pausa no hace nada
    s = pauseToggle(s, 12 * S);
    s = stop(s, 12 * S);
    const v = snapshot(s, 12 * S);
    expect(v.phase).toBe('done');
    expect(v.stopped).toBe(true);
    expect(v.roundsDone).toBe(1);
  });

  it('el central: pausa trabajando, play en espera, otra vez en hecho', () => {
    let s = start(createTimer(seriesPlan({ work: 2, rest: 0, rounds: 1 })), 0);
    s = tick(s, 3.5 * S);
    expect(snapshot(s, 3.5 * S).central).toBe('pause');
    s = primary(s, 3.5 * S);
    expect(snapshot(s, 3.5 * S).central).toBe('play');
    s = primary(s, 4 * S);
    s = tick(s, 10 * S);
    const v = snapshot(s, 10 * S);
    expect(v.phase).toBe('done');
    expect(v.central).toBe('play');
    s = primary(s, 10 * S);
    expect(snapshot(s, 10 * S).phase).toBe('countdown');
  });
});

describe('anterior y siguiente', () => {
  it('un toque en anterior reinicia el tramo', () => {
    let s = start(createTimer(seriesPlan({ work: 10, rest: 5, rounds: 2 })), 0);
    s = tick(s, 9 * S); // trabajo, quedan 4
    s = prev(s, 9 * S);
    expect(snapshot(s, 9 * S).n).toBe(10);
    expect(snapshot(s, 9 * S).phase).toBe('work');
  });

  it('dos toques en menos de 400 ms van al tramo anterior', () => {
    let s = start(createTimer(seriesPlan({ work: 10, rest: 5, rounds: 2 })), 0);
    s = tick(s, 15 * S); // descanso de la serie 1
    expect(snapshot(s, 15 * S).phase).toBe('rest');
    s = prev(s, 15 * S);
    s = prev(s, 15 * S + 300);
    // Vuelve al 3·2·1 de ese trabajo (nunca a trabajar sin aviso), y luego el trabajo entero.
    let v = snapshot(s, 15.3 * S);
    expect(v.phase).toBe('countdown');
    expect(v.round).toBe(1);
    v = snapshot(tick(s, 18.3 * S), 18.3 * S);
    expect(v.phase).toBe('work');
    expect(v.n).toBe(10);
  });

  it('en Tabata (un solo 3·2·1 al principio) dos toques vuelven al trabajo sin cuenta atrás de por medio', () => {
    let s = start(createTimer(tabataPlan({ work: 20, rest: 10, rounds: 3 })), 0);
    s = tick(s, 55 * S); // descanso de la ronda 2 (53–63 s)
    expect(snapshot(s, 55 * S).phase).toBe('rest');
    s = prev(s, 55 * S);
    s = prev(s, 55 * S + 100);
    const v = snapshot(s, 55.1 * S);
    expect(v.phase).toBe('work');
    expect(v.round).toBe(2);
  });

  it('dos toques separados más de 400 ms solo reinician', () => {
    let s = start(createTimer(seriesPlan({ work: 10, rest: 5, rounds: 2 })), 0);
    s = tick(s, 15 * S);
    s = prev(s, 15 * S);
    s = prev(s, 15 * S + 500);
    expect(snapshot(s, 15.5 * S).phase).toBe('rest');
  });

  it('siguiente salta al tramo siguiente y acaba tras el último', () => {
    let s = start(createTimer(tabataPlan({ work: 20, rest: 10, rounds: 2 })), 0);
    s = tick(s, 4 * S);
    s = next(s, 4 * S);
    expect(snapshot(s, 4 * S).phase).toBe('rest');
    s = next(s, 4 * S);
    expect(snapshot(s, 4 * S).round).toBe(2);
    s = next(s, 4 * S);
    expect(snapshot(s, 4 * S).phase).toBe('done');
  });

  it('en pausa, anterior ocupa su sitio con parar', () => {
    let s = start(createTimer(seriesPlan({ work: 10, rest: 5, rounds: 2 })), 0);
    expect(snapshot(s, 0).left).toBe('prev');
    s = pauseToggle(s, 1 * S);
    expect(snapshot(s, 1 * S).left).toBe('stop');
  });
});

describe('llamada', () => {
  it('congela y vuelve con 3·2·1 sin perder tiempo de trabajo', () => {
    let s = start(createTimer(seriesPlan({ work: 30, rest: 10, rounds: 1 })), 0);
    s = tick(s, 13 * S); // trabajo, quedan 20
    s = interrupt(s, 13 * S);
    expect(snapshot(s, 100 * S).paused).toBe(true);
    s = resume(s, 100 * S);
    let v = snapshot(tick(s, 100 * S), 100 * S);
    expect(v.phase).toBe('countdown');
    expect(v.n).toBe(3);
    v = snapshot(tick(s, 103 * S), 103 * S);
    expect(v.phase).toBe('work');
    expect(v.n).toBe(20);
  });

  it('el central, tras una llamada, sigue con 3·2·1 (no de golpe)', () => {
    let s = start(createTimer(seriesPlan({ work: 30, rest: 10, rounds: 1 })), 0);
    s = interrupt(tick(s, 13 * S), 13 * S);
    const v0 = snapshot(s, 50 * S);
    expect(v0.interrupted).toBe(true);
    expect(v0.pausedFor).toBe(37);
    s = primary(s, 50 * S);
    expect(snapshot(tick(s, 50 * S), 50 * S).phase).toBe('countdown');
    expect(snapshot(tick(s, 53 * S), 53 * S).n).toBe(20);
  });
});

describe('retomar (KC3)', () => {
  it('congela donde se guardó y sigue con 3·2·1', () => {
    let s = start(createTimer(seriesPlan({ work: 30, rest: 10, rounds: 2 })), 0);
    s = freeze(s, 13 * S); // se cerró la app con 20 s por delante
    const v = snapshot(s, 9_000 * S);
    expect(v.paused && v.interrupted).toBe(true);
    expect(v.n).toBe(20);
    s = primary(s, 9_000 * S);
    expect(snapshot(tick(s, 9_003 * S), 9_003 * S).n).toBe(20);
  });

  it('terminar aquí acaba aunque no esté en pausa (repeticiones o espera)', () => {
    const plan = [
      { kind: 'reps' as const, duration: Infinity, round: 1, ref: 1 },
      { kind: 'reps' as const, duration: Infinity, round: 2, ref: 2 },
    ];
    let s = freeze(primary(start(createTimer(plan), 0), 1 * S), 5 * S);
    expect(stop(s, 6 * S)).toBe(s); // parar exige pausa
    s = end(s, 6 * S);
    const v = snapshot(s, 6 * S);
    expect(v.phase).toBe('done');
    expect(v.stopped).toBe(true);
    expect(v.roundsDone).toBe(1);
  });

  it('en repeticiones no congela: ya espera al atleta', () => {
    const plan = [{ kind: 'reps' as const, duration: Infinity, round: 1, ref: 1 }];
    const s = freeze(start(createTimer(plan), 0), 5 * S);
    expect(s.pausedAt).toBeNull();
    expect(snapshot(s, 6 * S).central).toBe('check');
  });
});

describe('progreso', () => {
  it('progress del tramo va de 0 a 1', () => {
    let s = start(createTimer(seriesPlan({ work: 10, rest: 5, rounds: 1 })), 0);
    s = tick(s, 8 * S);
    expect(snapshot(s, 8 * S).progress).toBeCloseTo(0.5);
  });
});

describe('señales', () => {
  it('pitidos cortos en el 3·2·1, largo al empezar y doble al acabar', () => {
    let s = start(createTimer(seriesPlan({ work: 2, rest: 0, rounds: 2 })), 0);
    const seen: string[] = [];
    let last = snapshot(createTimer(s.plan), 0);
    for (let t = 0; t <= 20 * S; t += 250) {
      s = tick(s, t);
      const v = snapshot(s, t);
      seen.push(...cues(last, v));
      last = v;
      if (v.phase === 'wait' && t > 6 * S) s = primary(s, t);
    }
    expect(seen.slice(0, 5)).toEqual(['count', 'count', 'count', 'start', 'end']);
    expect(seen.at(-1)).toBe('finish');
  });

  it('en pausa no suena nada', () => {
    let s = start(createTimer(seriesPlan({ work: 5, rest: 2, rounds: 1 })), 0);
    s = pauseToggle(s, 500);
    expect(cues(snapshot(s, 0), snapshot(s, 3 * S))).toEqual([]);
  });
});

describe('repeticiones', () => {
  const plan = [
    { kind: 'reps' as const, duration: Infinity, round: 1, ref: 10 },
    { kind: 'reps' as const, duration: Infinity, round: 2, ref: 11 },
  ];

  it('otro ejercicio antes (KC8): pasa a ser el actual y el de ahora va detrás', () => {
    const three = [...plan, { kind: 'reps' as const, duration: Infinity, round: 3, ref: 12 }];
    let s = start(createTimer(three), 0);
    s = bringForward(s, 12, 5 * S);
    expect(s.plan.map((p) => p.ref)).toEqual([12, 10, 11]);
    expect(snapshot(s, 5 * S).ref).toBe(12);
    s = primary(s, 6 * S);
    expect(snapshot(s, 6 * S).ref).toBe(10);
    // Un tramo ya pasado o inexistente no se mueve.
    expect(bringForward(s, 12, 7 * S).plan.map((p) => p.ref)).toEqual([12, 10, 11]);
  });

  it('no avanzan solas; el central es ✓ y pasa a la siguiente', () => {
    let s = start(createTimer(plan), 0);
    s = tick(s, 999 * S);
    let v = snapshot(s, 999 * S);
    expect(v.phase).toBe('reps');
    expect(v.central).toBe('check');
    expect(v.ref).toBe(10);
    s = primary(s, 999 * S);
    v = snapshot(s, 999 * S);
    expect(v.ref).toBe(11);
    s = primary(s, 1000 * S);
    v = snapshot(s, 1000 * S);
    expect(v.phase).toBe('done');
    expect(v.roundsDone).toBe(2);
  });

  it('se pausan (mantener el central) y desde la pausa se puede parar guardando', () => {
    let s = start(createTimer(plan), 0);
    s = primary(s, 1 * S); // primera serie hecha
    s = pauseToggle(s, 2 * S);
    let v = snapshot(s, 30 * S);
    expect(v.paused).toBe(true);
    expect(v.phase).toBe('reps');
    expect(v.central).toBe('play');
    expect(v.left).toBe('stop');
    s = stop(s, 30 * S);
    v = snapshot(s, 30 * S);
    expect(v.phase).toBe('done');
    expect(v.stopped).toBe(true);
    expect(v.roundsDone).toBe(1);
  });

  it('al seguir tras la pausa, el central vuelve a ser ✓ en la misma serie', () => {
    let s = start(createTimer(plan), 0);
    s = pauseToggle(s, 1 * S);
    s = primary(s, 5 * S);
    const v = snapshot(s, 5 * S);
    expect(v.paused).toBe(false);
    expect(v.central).toBe('check');
    expect(v.ref).toBe(10);
  });

  it('dos toques en anterior vuelven a la serie anterior', () => {
    let s = start(createTimer(plan), 0);
    s = primary(s, 1 * S);
    s = prev(s, 2 * S);
    s = prev(s, 2 * S + 100);
    expect(snapshot(s, 2.1 * S).ref).toBe(10);
  });
});

describe('cuenta atrás configurable', () => {
  it('sin 3·2·1 o con 10 s', () => {
    expect(seriesPlan({ work: 30, rest: 0, rounds: 2, countdown: 0 }).map((p) => p.kind)).toEqual(['work', 'wait', 'work']);
    expect(tabataPlan({ work: 20, rest: 10, rounds: 2, countdown: 10 })[0]).toEqual({ kind: 'countdown', duration: 10, round: 1 });
    expect(tabataPlan({ work: 20, rest: 10, rounds: 2, countdown: 0 })[0].kind).toBe('work');
  });
  it('con 10 s solo pita en el 3·2·1', () => {
    let s: TimerState = start(createTimer(seriesPlan({ work: 30, rest: 0, rounds: 1, countdown: 10 })), 0);
    let prevSnap = snapshot(s, 0);
    let counts = 0;
    for (let t = 200; t <= 10_000; t += 200) {
      s = tick(s, t);
      const snap = snapshot(s, t);
      counts += cues(prevSnap, snap).filter((c) => c === 'count').length;
      prevSnap = snap;
    }
    expect(counts).toBe(3);
  });
});

describe('avisos con la pantalla bloqueada', () => {
  it('lista los próximos cambios con su instante, hasta acabar', () => {
    const s = start(createTimer(tabataPlan({ work: 20, rest: 10, rounds: 2 })), 0);
    expect(upcomingChanges(s, 1 * S)).toEqual([
      { at: 3 * S, kind: 'work' },
      { at: 23 * S, kind: 'rest' },
      { at: 33 * S, kind: 'work' },
      { at: 53 * S, kind: 'done' },
    ]);
  });

  it('se para en una espera manual y no avisa en pausa', () => {
    let s = start(createTimer(seriesPlan({ work: 10, rest: 0, rounds: 2 })), 0);
    expect(upcomingChanges(s, 0).map((c) => c.kind)).toEqual(['work', 'wait']);
    s = pauseToggle(s, 5 * S);
    expect(upcomingChanges(s, 6 * S)).toEqual([]);
  });
});
