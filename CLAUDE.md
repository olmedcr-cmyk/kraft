# KRAFT — app del atleta

El entrenador manda la sesión ya hecha; el atleta solo toca. El círculo es la unidad: un segundo, una serie, una ronda.
Usuario tipo: cansado, móvil en el suelo, con música; mira un segundo y vuelve al ejercicio.

## Fuentes de verdad (en este repo)

- `design/screens/*.dc.html` — las 50 pantallas + 6 tableros de sistema, exportados del lienzo de diseño. Son HTML con estilos inline: léelos para medidas exactas. `{{...}}`, `<sc-for>`, `<sc-if>` y la clase `Component` del final son la lógica del prototipo (los temporizadores de `KR5Time` y `KR5Tabata` funcionan de verdad: úsalos como referencia de la máquina de estados).
- `design/png/*.png` — captura de cada pantalla a 390×844.
- `design/tokens/tokens.json` y `tokens.css` — todos los valores. Si un valor no está ahí, es un error.
- `assets/illustrations/*.png` — ejercicios en 3 fases (Workout Guide · Bryl Lim / Everkinetic · CC BY-SA 4.0: el crédito debe verse en la app).
- Tableros clave: `K0Brand` (marca), `K1Components` (componentes), `K2Sitemap` (mapa), `K3Journeys` (6 recorridos), `K5Audit` (reglas de pulido).

## Tres reglas

1. **Un número, una regla.** Ningún valor fuera de escala.
   - Cifras (Fibonacci, ×1,618): 233 · 144 · 89 · 55 · 34, peso 300. Texto: 22 · 18 · 15 · 13 · 11. En marcha, nada bajo 18.
   - Espacio: 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64. Pantalla: 16 a los lados, 64 arriba, 8 entre tarjetas, 16 dentro.
   - Radio: 4 · 8 · 16 · 24 · 32 · píldora · círculo. **Interior = exterior − padding** (fila de bloque 32 − 16 = icono 16).
   - Toque: 48 dedo · 64 tecla · 88 fila · 104 acción · 144 mando · 280 palma.
2. **Color = estado.** Klein #002FA7 trabajo/selección · Verde #0A7B57 todo bien (hecho, reservado, pagado) · Naranja #FF5A1F actuar, Tabata, número del 3·2·1 · Tinta #141414 espera, pausa, cuenta atrás · Amarillo #FFC93C solo marca de grupo. Ningún estado solo por color: siempre palabra o píldora de fase.
3. **En marcha, un solo mando.** Barra a sangre de 144 en tinta: anterior · central naranja 104 · siguiente.
   - Central: pausa trabajando, play en espera, ✓ en repeticiones.
   - Anterior: 1 toque reinicia el tramo; 2 toques en <400 ms, tramo anterior.
   - Parar solo aparece en pausa (ocupa el sitio de anterior) y guarda lo hecho.
   - Palma = el centro (el número). Bordes y cabecera no pausan.

Tipografía única: Roboto Mono 300/400/500. Iconos redondeados, sin emoji. Botones en frase, nunca en mayúsculas.

## Temporizador

Estados: elegir → 3·2·1 → trabajo → (descanso fijo | espera manual) → 3·2·1 … → hecho. Pausa desde cualquier estado en marcha; parar solo desde pausa.
Fondo: 3·2·1 tinta con número naranja · trabajo Klein (Tabata: naranja) · descanso y hecho verde · espera y pausa tinta.
Libre: trabajo 30/45/60/90 s, descanso manual/10/15/30 s. Tabata: 20/10×8, 30/15×8, 40/20×6. En sesión, las series las fija el entrenador.
Sonido: 3 pitidos cortos en el 3·2·1, largo al empezar y acabar tramo; vibración corta/larga/doble; la música baja, no se para; suena en silencio si el usuario lo activa.
Plataforma: corre en segundo plano; Live Activity / pantalla de bloqueo con número, puntos y pausa; llamada congela y vuelve con 3·2·1; todo funciona sin red.

## Recorridos (pantallas por nombre de archivo)

| Recorrido | Pantallas |
| --- | --- |
| R1 Primera vez | K4Store → K5Splash → K6Welcome → K7Coach → K8Permissions → K9Palm → J2Today |
| R2 Sesión del día | KC7Push → J2Today → J3Warmup → J4Hold → J5Next → J6Tabata → J7Ladder → J8Finish · pausa KP1Paused |
| R3 No sé el ejercicio | J4Hold → J4How (el tiempo sigue) · VB2Search → KX1Exercise |
| R4 Reservar | KR4Agenda → KR4Booking → KR4Reminder → KR4Arrive · KR4Change · KR4Waitlist |
| R5 Entrenar libre | KR5Time · KR5Tabata · KR5Saved |
| R6 Diario y pago | KR6Diary → KR6Pay → KR6Receipt · KR6Data |
| Tú | KT1You · KT2Training · KT3Sound · KT4Alerts · KT5Coach · KT6Account |
| Legal | KL1Privacy · KL2Health · KL3Data · KL4Delete · KL5Doc |
| Casos límite | KC1Empty · KC2Changed · KC3Resume · KC4Offline · KC5Call · KC6Live · KC8Weight |

Navegación: 4 pestañas (Hoy, Tiempo, Agenda, Diario) + avatar arriba a la derecha → Tú. Oculta en marcha.
Datos de ejemplo (Elena, martes 50', 42 €) son relleno.

## Legal (RGPD, España — texto final pendiente de abogado)

Aceptación + 14 años o más en la bienvenida. Analítica y emails apagados por defecto. Salud: consentimiento propio, solo escribe entrenos y calorías. Descargar datos en CSV; borrar cuenta en 30 días; recibos se guardan lo que pida la ley.

## Abierto — decidir antes de codificar

- Plataforma: nativo (SwiftUI + Kotlin) o multiplataforma (p. ej. Expo/React Native con módulo nativo para Live Activity). Proponer con pros y contras antes de crear el proyecto.
- Formato de la sesión que envía el entrenador (bloques, tramos, reps, peso) y backend.
- Fuera de v1: lado del entrenador, widget, Apple Watch.

## Cómo empezar

1. Proponer stack y estructura del proyecto; esperar aprobación.
2. Tokens → tema (colores, tipo, espacio, radios) desde `design/tokens/tokens.json`.
3. Componentes de `K1Components`: mando, palma, anillo de puntos, fila de bloque, barra de acción, píldora de fase, navegación.
4. Motor del temporizador con tests (estados y transiciones de arriba), luego R5 (entrenar libre) como primera pantalla funcional, luego R2.
5. Comparar cada pantalla con su PNG en `design/png/` antes de darla por buena.
