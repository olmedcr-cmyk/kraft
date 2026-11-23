# Auditoría KRAFT · 22 nov 2026

Usabilidad, accesibilidad, diseño, interacción y responsive. Solo lectura: no se ha cambiado código.
Cómo: cuatro revisiones del código en paralelo (accesibilidad, diseño, interacción, usabilidad) con las skills
accessibility-engineering, design:accessibility-review, emil-design-eng, design:design-critique, animate-expo, mobile-native,
ux-ui-audit, design:ux-copy y break-ui; Hallmark como criterio general; y un recorrido en el navegador en modo demo
a 390×844, 320×568 y 1280×800. No probado en iPhone ni Android reales.

**Estado (23 nov):** arreglados todos los críticos, altos y medios salvo:
- **3 · llamada**: sin un módulo nativo (CallKit en iOS, estado del teléfono en Android) la app no se entera; va con la versión de pago, como la Live Activity. El 15 (pantalla bloqueada) queda con avisos locales con sonido.
- **39 · enlaces «términos» y «privacidad»**: son texto en línea y en React Native no admiten zona de toque mayor sin cambiar el diseño.
- **37 · palma y botones en frase**: se aplica la regla de CLAUDE.md aunque varias pantallas del diseño (KR5Time, KR4Arrive, K9Palm) los traían en mayúsculas.
- **Teclado del código**: se queda en 56 (lo que pide K7Coach; 64 no cabe en móviles pequeños).

✔ = comprobado a mano (en el código o en el navegador). El resto sale de leer el código; tiene archivo:línea para revisarlo.

## Crítico

1. ✔ **El entreno se pierde si no se toca el ✓ de Hecho.** `src/features/sesion/HechoScreen.tsx:52-59` solo guarda en `close`, y `src/session/marcha.ts:42-45` borra la marcha al terminar. Cerrar la app, bloquear o «atrás» en Android desde Hecho = entreno perdido. → Guardar al entrar en Hecho (una vez); el ✓ solo cierra.
2. ✔ **En la Escalera (repeticiones) y en espera manual no hay pausa, y por tanto tampoco «Parar».** `src/timer/engine.ts:196,244` devuelven el estado sin tocar. La única salida es pulsar «siguiente» hasta el final, lo que además registra todo como hecho (`engine.ts:155`). → Permitir pausa en tramos manuales; «siguiente» en el último no cuenta como completado.
3. ✔ **Una llamada no congela el reloj (KC5).** `interrupt()` existe y tiene tests, pero nada lo llama (`src/timer/runner.ts:109`). → Llamarlo al interrumpirse el audio o con AppState `inactive`.
4. ✔ **Con lector de pantalla no se sabe cuánto falta.** La palma tiene etiqueta fija «Palma · toca el centro para pausar» que tapa la cifra y la fase (`src/features/sesion/Tiempo.tsx:29`, también `:57`, `TabataMarcha.tsx:59`, `MarchaScreen.tsx:177`). → Etiqueta dinámica: «Trabajo, quedan 12 segundos. Toca para pausar».

## Alto

5. ✔ **Vincular ocurre al teclear la 6ª cifra**, antes de pulsar «Vincular», y desvincula al anterior (`src/features/alta/EntrenadorScreen.tsx:38-50`). Desde Tú → «Cambiar de entrenador» no hay «Volver». → La 6ª cifra solo busca; vincula el botón; añadir Volver.
6. ✔ **«Dejar de entrenar con X» solo cambia el móvil**; en el servidor sigue vinculado y el entrenador sigue viendo datos (`src/features/tu/EntrenadorTuScreen.tsx:71-74`). → Desvincular en el servidor (`unlink_coach`) y explicar qué pasa con reservas.
7. ✔ **Agenda solo muestra la semana actual** (`src/features/agenda/AgendaScreen.tsx:151`, `weekStart(today)`). Un sábado no se puede reservar el lunes; el servidor ya manda 15 días. → Pasar a la semana siguiente.
8. **Volver a entrar repite todo el alta** (entrenador, permisos, palma): `CodigoScreen.tsx:43`, `(tabs)/_layout.tsx:18`. → Si ya tenía entrenador, ir directo a Hoy.
9. **Borrar cuenta promete un email que no existe** (`src/features/legal/BorrarScreen.tsx:39`), y volver a entrar anula el borrado sin avisar (`PalmaScreen.tsx:23`). → «Se borra el 22 dic. Si vuelves a entrar antes, se anula».
10. **Primera vez sin red o con error del servidor**: Hoy queda en un círculo sin texto diciendo «tu sesión está guardada» (no hay nada guardado); Agenda dice «Cerrado» en carga, error y sin entrenador (`HoyScreen.tsx:136`, `data.ts:120`, `AgendaScreen.tsx:118`). → Cargando · No se pudo cargar + Reintentar · Sin entrenador + Vincular.
11. **Cancelar clase y salir de la lista de espera: un toque, sin confirmar ni deshacer**; la cancelación tardía no dice cuánto cuesta (`src/features/agenda/CambiarScreen.tsx:85-104`). → Tarde: «Cancelar y pagar 8 €» con doble toque; a tiempo: aviso con Deshacer.
12. ✔ **Web en español anunciado como inglés**: `<html lang="en">` (visto en el navegador; no hay `src/app/+html.tsx`). → Crear `+html.tsx` con `lang="es"`, `viewport-fit=cover`, `overscroll-behavior: none`, sin resaltado al tocar y `user-select: none` en controles (evita recargar con pull-to-refresh en mitad de la sesión y seleccionar la cifra con un toque largo).
13. ✔ **Escritorio y tablet: la app se estira a todo el ancho** (visto a 1280: filas de 1250 px, nav gigante). → Limitar a ~480 px centrado en web.
14. ✔ **El código de 6 cifras no se puede teclear con el teclado físico en web**, e iOS no puede autorrellenarlo desde Mail (teclado propio sin `TextInput`) (`CodigoScreen.tsx`). → Campo oculto con `textContentType="oneTimeCode"` / `autocomplete="one-time-code"` que acepte teclas.
15. **Pantalla bloqueada en iOS: no suenan los cambios de tramo** (el `setInterval` se duerme; `UIBackgroundModes: audio` no basta). → Programar notificaciones locales con sonido al pasar a segundo plano. Live Activity sigue pendiente.
16. **Web: la pantalla se apaga tras cambiar de pestaña** (Wake Lock no se vuelve a pedir, `src/timer/useTimer.ts:22-32`). → Repedir en `visibilitychange`.
17. **iOS no anuncia cambios** (no hay `announceForAccessibility`; `accessibilityLiveRegion` solo es Android): fase del temporizador y errores de formularios. Y en Tabata, `accessibilityLiveRegion` sobre la cifra (`TabataScreen.tsx:134`) haría que TalkBack/web lean sin parar. → Anunciar solo cambios de fase y errores.
18. **Contraste insuficiente** (ratios con los tokens):
    - errores en naranja sobre fondo: 2,76:1 a 13 px (`CorreoScreen.tsx:38`, `CodigoScreen.tsx:75`, `EntrenadorScreen.tsx:81`) → texto tinta con marca naranja;
    - píldora «Descanso» blanco sobre verde translúcido: 3,31:1 (`Tiempo.tsx:32`);
    - `linea` como borde de interruptor apagado, casillas vacías y placeholder: 1,46:1 (`Interruptor.tsx:22`, `Teclado.tsx:22`, `CorreoScreen.tsx:52`) → texto2.
19. **Texto en marcha bajo 18** (regla de CLAUDE.md): `PildoraFase` a 11 en `SeriesScreen.tsx:150` y `TabataScreen.tsx:146`; números del radio 11 (`Radio.tsx:62`); kg 11 y unidad 13 en `Escalera.tsx:76,92`; «Mantén» 15 en `TabataMarcha.tsx:158`.
20. **Texto grande del sistema rompe las cifras**: sin `maxFontSizeMultiplier` y con altos fijos; la cifra de 233 se sale de la palma (`MarchaScreen.tsx:127`, `Tiempo.tsx:61`…), `PildoraFase` (alto 32), Navegación (56), Permisos (104). → `maxFontSizeMultiplier={1}` en cifras, ~1,4 en texto en marcha, `minHeight`.

## Medio

21. **Navegación distinta del diseño** (`src/components/Navegacion.tsx:44,69,103`): pestañas de 56 (diseño 64), carril blanco con sombra (diseño hundido #E8E7E2, radio 24, interior 20), icono de Tiempo activo en naranja (diseño blanco).
22. **En Mantener la palma ocupa todo el ancho**, así que tocar el borde pausa (`Tiempo.tsx:24-31,52-58`); en Tabata sí está limitada al número.
23. **Dos vibraciones por acción** y `Pulsable` ignora el ajuste «vibrar» (`Pulsable.tsx:12-20`, `Mando.tsx:46`, `feedback.ts:51`).
24. **Con «pausa con la palma» apagada, la palma sigue encogiendo y vibrando** sin hacer nada (`MarchaScreen.tsx:54`).
25. **El primer pitido del 3·2·1 se pierde la primera vez**; en Safari web los `play()` desde un intervalo pueden bloquearse (`runner.ts:91-95`, `feedback.ts:21-33`). Verificar en dispositivo.
26. **Gesto atrás / botón atrás de Android puede cerrar la sesión en marcha** (`gestureEnabled:false` solo en el stack interno, sin `usePreventRemove`: `src/app/sesion/_layout.tsx:11`, `src/app/_layout.tsx:52`). Verificar en dispositivo.
27. **«Doble toque en 400 ms» imposible con VoiceOver/Switch Control** (`Mando.tsx:37-44`). → `accessibilityActions` «Tramo anterior».
28. **Doble toque en «anterior» vuelve a un tramo de trabajo sin su 3·2·1** (`engine.ts:133,224-229`).
29. **«Terminar aquí» (Retomar) no termina** si se guardó en repeticiones o espera (`marcha.ts:86-87`).
30. **Cerrar sesión sin red borra en silencio los envíos pendientes** (`CuentaScreen.tsx:36-43`, `sync.ts`). → Avisar «Tienes 3 cambios sin enviar».
31. **Pago sin red muestra «Pagado» al momento** aunque el servidor pueda rechazarlo; importes del servidor pueden salir «42.5 €» (`PagoScreen.tsx:31-32`). → «Pendiente de confirmar» e `Intl.NumberFormat('es-ES', {style:'currency',currency:'EUR'})`.
32. **Datos de ejemplo con servidor real**: inicial «C» (`HoyScreen.tsx:27`), «7 dentro» (`LlegoScreen.tsx:18`), texto del estudio (`EntrenadorTuScreen.tsx:17`), tarjeta 4242 (`CuentaScreen.tsx:10`), precios calculados en el móvil (`diario/model.ts:34`).
33. **«Descargar todo» (RGPD) no incluye email, reservas ni notas enviadas**; el servidor ya tiene `export_my_data` sin usar (`src/legal/model.ts:44`).
34. **Pantallas sin salida**: `Vacio` sin Volver ni acción (reserva borrada abierta desde un aviso, «Ayuda», «Escribir a X» → «Aún no está diseñado»).
35. **Código por email**: tras un código erróneo las teclas no responden hasta borrar; el email enmascarado oculta erratas (`CodigoScreen.tsx:58,76`). → Vaciar al fallar y «¿No es tu email?».
36. **Radios anidados mal calculados**: `ReservaScreen.tsx:126` (resta 12 con padding 16), `TabataMarcha.tsx:116` (12), `FilaBloque.tsx:30,50` (20, fuera de escala). Radio 6 en `PagoScreen.tsx:62`, `ProgresoScreen.tsx:167`, `AvisosScreen.tsx:40`.
37. **Botones en mayúsculas** (la regla dice en frase): «Siguiente serie», «Otra vez» (`SeriesScreen.tsx:373,384`), «Estoy aquí» (`LlegoScreen.tsx:69`), `PalmaScreen.tsx:48`, meses del Diario (`DiarioScreen.tsx:107`). Ojo: KR5Time y KR4Arrive vienen así del diseño; decide cuál manda.
38. **Naranja decorativo**: punto «● Agenda» y «● Diario» (`agenda/piezas.tsx:72`, `diario/piezas.tsx:18`); K5Audit ya lo marca como cabecera antigua.
39. **Áreas de toque bajo 48**: días del Diario de 32 (`DiarioScreen.tsx:34,207`), enlaces «términos»/«privacidad» en línea (`BienvenidaScreen.tsx:89-95`); teclas del teclado de 56 en vez de 64 (`Teclado.tsx:49`).
40. **VoiceOver se salta descripciones** de puntos de progreso, casillas y Escalera: `accessibilityLabel` en `View` sin `accessible` (`piezas.tsx:51,81`, `TabataMarcha.tsx:39`, `Escalera.tsx:50`, `Teclado.tsx:12`, `MarchaScreen.tsx:92`). La Escalera además distingue hecho/actual/pendiente solo por color (`Escalera.tsx:58-70`).
41. **Web sin indicador de foco** en el campo de email (`outlineStyle:'none'`, `CorreoScreen.tsx:62`) y sin atajos de teclado en marcha (Espacio = central, flechas).

## Bajo

42. Valores sin token copiados del diseño (iconos 56, puntos 10/14, alturas de línea 18/20/22, espacios de 2): faltan en `tokens.json` más que sobran en el código.
43. Iconos con letras: «✓» duplicado junto a `CheckIcon` (`HoyScreen.tsx:192`), «›» como texto en varias filas (usar un `Chevron` SVG).
44. Icono de parar 24/radio 4 (diseño 28/8), ✓ del mando 36 (diseño 44), «?» de Escalera 18 (diseño 22).
45. A 320 px de ancho los iconos de bloque de Hoy pasan de cuadrado a círculo (fila compacta).
46. Textos: errores de Postgres en inglés tal cual (`sync/rechazo.ts:13`); «manual»/«auto» sin traducir (`TuScreen.tsx:73`); «miércoles 5 · 08:00» en minúscula (`CambiarScreen.tsx:46`); «Funcional · » colgando sin sala; «1 minutos», «1 tabatas» en etiquetas de lectura (`HechoScreen.tsx:79-81`); «Tú · Ajustes» no existe; si niega los avisos se apagan sin decir nada (`PermisosScreen.tsx:30`); punto de «con reserva» nunca sale con servidor (`AgendaScreen.tsx:160`).
47. Reloj de pared (`Date.now()`) para medir tramos: un ajuste de hora los salta (`runner.ts:86`).
48. «Reducir movimiento» se lee una vez y no escucha cambios (`piezas.tsx:128`).

## Bien hecho

- Motor del temporizador puro, basado en marcas de tiempo y con tests (28 pasan).
- Pulsable: respuesta al apretar (0,97 en 120 ms), deshabilitado visible, sin escala con movimiento reducido; solo se anima transform/opacidad/color; pestañas sin deslizar.
- Ningún color ni fuente fuera de los tokens; texto sobre naranja siempre en tinta (5,91:1).
- Roles y estados: pestañas `selected`, interruptores `checked`, cabeceras, Mando como `toolbar`, `hitSlop` hasta 48.
- RGPD por defecto (analítica, emails y salud apagados), cola sin red con mensajes de rechazo claros, Retomar con tres salidas.

## Hallmark

Pensado para webs: en una app manda el sistema propio (CLAUDE.md). Su regla de no usar etiquetas en mayúsculas con tracking choca con el diseño de KRAFT (etiquetas en caps a 0,08em): se respeta el diseño. Lo que sí aplica y falla: contenedor sin límite en escritorio (13), foco visible (41), estados de carga/vacío/error (10).
