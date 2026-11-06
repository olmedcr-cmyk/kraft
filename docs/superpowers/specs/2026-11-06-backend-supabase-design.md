# Backend de KRAFT en Supabase (UE) — diseño

Fecha: 6 nov 2026 · Estado: **pendiente de aprobación** · Decidido por el usuario: Supabase, servidores en la UE.

## Para qué

Hoy la app funciona entera en el móvil con datos de ejemplo: el diario y las reservas se pierden al recargar y cada dispositivo empieza de cero. El backend sirve para cuatro cosas, en este orden:

1. **Cuentas**: entrar con email (y Apple / Google), y que tus datos te sigan de un móvil a otro.
2. **La sesión del día llega del entrenador** en vez de venir escrita en el código.
3. **Diario y reservas guardados** y compartidos con el entrenador (plazas reales, lista de espera real).
4. **RGPD de verdad**: descargar tus datos desde el servidor y borrar la cuenta a los 30 días.

## Objetivos, no-objetivos y anti-objetivos

- **Objetivos**: las cuatro cosas de arriba; datos en Frankfurt (`eu-central-1`); la app sigue funcionando sin red (CLAUDE.md: «todo funciona sin red»).
- **No-objetivos de este hito**: pasarela de pago real, avisos push desde servidor, app o panel del entrenador, Live Activity. Los pagos siguen simulados, pero quedan guardados.
- **Anti-objetivos** (sería un fracaso aunque funcione):
  - que el temporizador dependa de la red o espere al servidor;
  - que un entrenador vea atletas que no son suyos, o esfuerzo y notas con «compartir» apagado;
  - que la clave de servicio (`service_role`) acabe dentro de la app;
  - que un atleta pueda marcarse un pago como hecho desde el móvil.

## Arquitectura

```
App (Expo: iOS, Android, web en Vercel)
  └─ supabase-js ──► Supabase (Frankfurt)
                      ├─ Auth: email con código, Apple, Google
                      ├─ Postgres + RLS: cada fila, solo para quien toca
                      ├─ Funciones SQL (RPC): reservar, cancelar, vincular entrenador, exportar
                      └─ pg_cron: borrar cuentas a los 30 días, cerrar listas de espera
```

- La app habla directo con Postgres por `supabase-js`. La seguridad está en **RLS** (Row Level Security), no en la app.
- Todo lo que tiene reglas de negocio (aforo, plazo de 2 h, lista de espera, código de entrenador) va en **funciones SQL** `security definer`. La app las llama; no escribe esas tablas a mano.
- **Sin red primero**: los stores actuales (`agenda`, `diario`, `session`, `settings`) siguen siendo lo que pinta la pantalla. Se añade:
  - una **cola de envíos** guardada en el dispositivo (AsyncStorage) que se vacía al volver la red;
  - una **caché** de lo último que llegó del servidor.
  Cada escritura lleva un `client_id` (uuid) para que reenviarla no la duplique.

## Datos (Postgres)

Importes en céntimos. Fechas en `timestamptz`; el día de entreno en `date` (día local del atleta).

| Tabla | Qué guarda | Quién lee / escribe |
| --- | --- | --- |
| `profiles` | id (= usuario), nombre, rol `athlete`/`coach`, aceptado el, compartir, analítica, emails, salud, borrado pedido el | Cada uno el suyo. El entrenador lee nombre de sus atletas |
| `coaches` | id, código de 6 cifras (único), nombre, modos, precios por modo | Todos leen nombre y modos solo vía `link_coach`; el entrenador, el suyo |
| `coach_athletes` | entrenador, atleta, vinculado el, desvinculado el | Ambos leen; escribe solo `link_coach` / `unlink_coach` |
| `sessions` | id, entrenador, atleta (vacío = para todo su grupo; la propia manda sobre la de grupo), fecha, minutos, `body` (JSON, formato de abajo), versión del formato, versión, creada/editada | Atleta: lee las suyas. Entrenador: todo sobre las de sus atletas |
| `workouts` | id, atleta, día, minutos, tabatas, sesión, esfuerzo (1–10), nota, `client_id` | Atleta: todo. Entrenador: lee; esfuerzo y nota solo si `compartir` |
| `slots` | id, entrenador, modo, empieza, minutos, nombre, sala, planta, cómo llegar, aforo, qué traer | Atletas vinculados leen; entrenador escribe |
| `bookings` | id, clase, atleta, estado (`confirmed`, `waitlist`, `cancelled`, `late_cancel`), puesto, entrar solo, llegó el, reservada el | Atleta lee las suyas; escribe solo por funciones. Entrenador lee las de sus clases |
| `payments` | id, atleta, entrenador, mes, importe, método, referencia, pagado el, recibo enviado el | Atleta y entrenador leen. **Solo el servidor escribe** |

**Ajustes**: suben al servidor solo los que importan fuera del móvil (nombre, aceptación, compartir, analítica, emails, salud, borrado pedido). Sonido, cuenta atrás, descanso, peso y avisos se quedan en el dispositivo, como ahora.

La factura del mes no se guarda: se calcula de las reservas (`llegó` o `late_cancel`) × precio, igual que hoy `bill()` en `src/diario/model.ts`.

### Funciones (RPC)

- `link_coach(code)`: vincula al atleta; código erróneo → error sin pista (no confirma si existe).
- `book_slot(slot, auto_join)`: con aforo libre confirma; lleno, a la lista de espera con su puesto. Bloquea la fila de la clase para que dos personas no cojan la última plaza.
- `cancel_booking(booking)`: más de 2 h antes → `cancelled` y sube el primero de la lista con «entrar solo»; menos de 2 h → `late_cancel` (se cobra).
- `move_booking(from, to)`, `mark_arrived(booking)`, `unmark_arrived(booking)`.
- `export_my_data()`: devuelve todo lo tuyo en JSON; la app lo convierte con el `exportCsv` que ya existe.
- `request_deletion()` / `cancel_deletion()`: apunta o anula la fecha.
- `simulate_payment(month, method)`: **solo mientras no haya pasarela**. Comprueba que el mes está cerrado y sin pagar, y escribe el pago con el importe calculado en el servidor (el móvil no manda el importe). Se borra en la migración que traiga la pasarela.
- Diario: `workouts` se escribe directo (RLS: solo tus filas), con `upsert` por `client_id`.

### Tareas programadas (pg_cron)

- Cada noche: borra los usuarios con borrado pedido hace más de 30 días. Sus `payments` se quedan, sin enlace al usuario pero con nombre y NIF del recibo copiados, el tiempo que pida la ley (dato del abogado).
- Cada 5 min: cierra la lista de espera de clases que ya empezaron.

## Formato de la sesión (v1)

Es el que ya usa la app (`src/session/types.ts`), guardado en `sessions.body` con `"schemaVersion": 1`. Resumen:

```
Sesión  { date, minutes, blocks[] }
Bloque  = interval | tabata | ladder   (todos: id, name, tint, minutes, isNew?)
  interval: steps[] { exercise?, label, seconds, rest (0 = espera manual), hold? }
  tabata:   work, rest, rounds, sets, setRest, a { exercise, label, weight?, hold? }, b?
  ladder:   exercise { id?, label }, steps[] { reps, weight (kg | null) }, after[] { label, detail? }
```

Decisiones dentro del formato:
- **Peso siempre en kg** en el servidor; la app lo enseña en kg o lb según Tú · Entreno.
- **El color del bloque (`tint`) lo elige el entrenador** entre los 4 permitidos.
- **El coach no se repite en el JSON**: sale de `sessions.coach_id`.
- Validación: una función pura `validateSession(json)` en la app, con tests. Si una sesión no pasa, Hoy enseña el estado vacío en vez de romperse. En la base de datos solo se comprueba que `blocks` es una lista.
- Para cambiar el formato: `schemaVersion: 2` y la app sabe leer las dos.

Sin app de entrenador (fuera de v1), las sesiones se cargan con un script `scripts/subir-sesion.ts` que lee un JSON y lo sube con la clave de servicio **desde el ordenador**, nunca desde la app. Mientras, la de ejemplo (Elena, martes 50') se sube como semilla.

**Semilla** (también por script con la clave de servicio, porque Elena necesita usuario en Auth): la entrenadora Elena con el código `472913`, sus precios (grupo 8 €, solo 30 €, online 5 €), las clases de las próximas dos semanas (las mismas plantillas que `src/agenda/model.ts`) y la sesión de ejemplo como sesión de grupo (sin atleta) para cada día de esas dos semanas.

## Cuentas

- **Email con código de 6 cifras** (OTP de Supabase): funciona ya, sin cuentas de desarrollador.
- **Apple y Google**: el código va listo, pero se activan cuando haya cuenta de Apple Developer (99 €/año) y proyecto de Google Cloud. Apple es obligatorio en iOS si hay Google.
- La bienvenida (K6Welcome) ya tiene los tres botones; «Con email» abre la pantalla del código. **No hay diseño de esa pantalla**: la haré con las piezas de K7Coach (teclado de 6 cifras), que es la misma idea.
- La sesión se guarda en el dispositivo (AsyncStorage en móvil, localStorage en web).

## Claves y entornos

- La app solo lleva `EXPO_PUBLIC_SUPABASE_URL` y la clave pública (`anon` / publishable). Es pública por diseño: lo que protege son las reglas RLS.
- La clave de servicio vive solo en el ordenador (para el script de sesiones) y en Supabase; nunca en el repo ni en Vercel.
- Las migraciones SQL viven en `supabase/migrations/` y se aplican con `supabase db push`.
- Un solo proyecto por ahora («kraft», Frankfurt). Uno de pruebas aparte cuando haya usuarios reales.

## Cómo se comprueba

- Tests de RLS en SQL (`scripts/db/test.sh`: un Postgres temporal que imita a Supabase, sin Docker): un atleta no ve a otro; un entrenador no ve atletas ajenos ni notas sin «compartir»; nadie inserta pagos.
- Tests de las funciones: última plaza con dos reservas a la vez, plazo de 2 h, subida desde la lista de espera.
- Tests en la app (Jest): `validateSession`, la cola de envíos (reintentos, sin duplicados) y el paso de datos del servidor a los stores.
- A mano, en la web de Vercel: entrar con email en dos navegadores y ver los mismos datos.

## Orden de trabajo (un commit por paso)

1. Esquema, RLS, funciones, semilla y tests SQL.
2. Cuentas: email con código, sesión guardada, vincular entrenador contra el servidor.
3. Sesión del día desde el servidor, con caché sin red y `validateSession`.
4. Diario y reservas: lectura del servidor y cola de envíos.
5. Legal contra el servidor: exportar, pedir y anular borrado, tarea nocturna.
6. Variables en Vercel y nuevo despliegue.

## Lo que necesito de ti

1. Crear el proyecto en supabase.com: nombre «kraft», región **Central EU (Frankfurt)**. La contraseña de la base de datos la eliges tú y no me la pasas.
2. En la Terminal, iniciar sesión y enlazar el proyecto (te pedirá esa contraseña):
   `supabase login` y luego `supabase link --project-ref <ref>`, dentro de la carpeta `kraft`.
3. Pasarme la **URL del proyecto** y la **clave pública** (anon / publishable). Nunca la `service_role`.

## Lo que dejo a mi criterio (decisiones mías, revisables)

- Email con código antes que Apple/Google.
- Factura calculada, no guardada.
- `client_id` + cola de envíos en vez de sincronización completa: más simple, y basta porque cada dato tiene un solo dueño.
- Pantalla de código por email hecha con piezas de K7Coach, sin diseño propio.
- Plazo de borrado de recibos: «lo que pida la ley», hasta que el abogado dé la cifra.
