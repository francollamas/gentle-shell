# Intención de las personalizaciones

Este inventario describe comportamientos deseados, no una garantía de compatibilidad. Base inicial: `v4.5.1`. La implementación puede cambiar con upstream: conservar la intención, no necesariamente las líneas actuales. Ante dudas o cambios incompatibles, consultar al usuario. Actualizar este documento y las pruebas al añadir, cambiar o retirar una personalización.

En cada actualización comparar los tags oficiales y el diff de `custom` contra el nuevo tag; revisar cada apartado incluso si Git no reporta conflictos. Ejecutar las pruebas pertinentes, comprobar manualmente los comportamientos visuales cuando corresponda y comunicar qué quedó sin verificar. Un test aislado no demuestra que Pi funcione de extremo a extremo.

## Instalación y actualización del fork

- **Intención:** usar el checkout local como paquete de Pi, con directorio de agente configurable; preparar dependencias, runtime y complementos sin sustituirlo por `npm:gentle-pi`. `gentle-update` detecta releases estables y delega la actualización interactiva a Pi, sin modificar por sí mismo el historial ni publicar.
- **Superficies:** `custom/instalar-custom.mjs`, `custom/pi-config.mjs`, `custom/actualizar-custom.mjs` y `custom/INSTRUCCIONES-IA.md`. Preservar los complementos y precauciones allí documentados, especialmente los datos de Engram.
- **Comprobación:** `node --test custom/*.test.mjs`; revisar registro de paquete y directorio de Pi, y validar el flujo interactivo y la instalación cuando sea posible. La instalación completa en una máquina limpia no está validada.

## Temas y banner Catppuccin

- **Intención:** ofrecer Mocha, Macchiato, Frappé y Latte con contraste legible; Latte usa un fondo neutro para éxito. El banner adapta su paleta a temas claros y oscuros, con rosa estilo Mocha y vista previa coherente.
- **Superficies:** `themes/catppuccin-*.json`, licencias en `themes/`, `extensions/startup-banner.ts` y vista previa en `extensions/gentle-shell.ts`.
- **Comprobación:** `tests/startup-banner.test.ts` y pruebas visuales manuales con temas claros/oscuros, incluyendo éxito y vista previa; las pruebas automáticas no sustituyen la evaluación del contraste.

## Sidebar y presentación del estado

- **Intención:** mostrar el sidebar desde 130 columnas, con rail de 40 columnas; conservar el comportamiento apropiado debajo del umbral. Ocultar la pista del atajo de uso sin eliminar la funcionalidad correspondiente.
- **Superficies:** `lib/shell-sidebar-layout.ts`, `extensions/gentle-shell.ts`, `docs/gentle-shell.md`.
- **Comprobación:** `tests/shell-sidebar-layout.test.ts`, `tests/gentle-shell.test.ts` y revisión manual alrededor del umbral, en pantalla completa y estrecha.

## Autocompletado y presentación de modos

- **Intención:** presentar el menú nativo de autocompletado como overlay sin capturar su entrada; ocultarlo al cambiar de diálogo o destruir el editor, con fallback nativo si el host no soporta overlays. No mostrar indicadores redundantes YOLO/SUPER YOLO; esto no debe alterar permisos ni protecciones.
- **Superficies:** `lib/autocomplete-overlay.ts`, su licencia en `lib/PI-AUTOCOMPLETE-LICENSE.txt`, `lib/shell-prompt.ts`, `extensions/gentle-shell.ts`, `lib/yolo-session-policy.ts` y documentación de historial.
- **Comprobación:** `tests/autocomplete-overlay.test.ts`, `tests/gentle-shell.test.ts`, `tests/history-overlay-margin.test.ts`, `tests/yolo-mode.test.ts`, `tests/yolo-mode-runtime.test.ts` y `tests/yolo-customize.test.ts`; comprobar manualmente teclado, diálogos, fallback y modos. No confundir ocultar una etiqueta con desactivar una protección.

## Flujos de colaboración

- **Intención:** las skills de PR, issues y RDD deben seguir las reglas reales del repositorio de destino, sin imponer universalmente issue aprobado, etiqueta de tipo o autorización separada para cada operación necesaria cuando el usuario ya pidió crear una PR. Mantener la distinción entre preparar y publicar, y no inferir permiso para merge, acciones destructivas o comentarios no solicitados.
- **Superficies:** `skills/branch-pr/SKILL.md`, `skills/issue-creation/SKILL.md`, `skills/rdd-defect-workflow/SKILL.md`.
- **Comprobación:** `tests/branch-pr-skill.test.ts`, `tests/issue-creation-skill.test.ts`, `tests/rdd-defect-workflow-skill.test.ts`; revisar que cambios upstream de seguridad y autorización sigan respetándose y no se relajen accidentalmente.

## Ejecución de pruebas TypeScript

En esta versión pueden ejecutarse pruebas concretas con `node --experimental-strip-types --test tests/ARCHIVO.test.ts`; adaptar el comando si cambia el runner oficial. Para una actualización real, elegir además las comprobaciones de integración, runtime y pruebas completas según los cambios oficiales y registrar cualquier bloqueo.
