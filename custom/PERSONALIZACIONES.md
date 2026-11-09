# Intención de las personalizaciones

Este inventario describe comportamientos deseados, no una garantía de compatibilidad. Base inicial: `v4.5.1`; base actual: rama `release` (apunta a `v4.7.0`). La implementación puede cambiar con upstream: conservar la intención, no necesariamente las líneas actuales. Ante dudas o cambios incompatibles, consultar al usuario. Actualizar este documento y las pruebas al añadir, cambiar o retirar una personalización.

En cada actualización comparar los tags oficiales y el diff de la rama archivada (`custom-v<TAG-VIEJO>-archive`) contra el nuevo tag: como `custom` se reconstruye en lugar de rebasearse, Git nunca reporta conflictos y la revisión de cada apartado es manual y obligatoria. Ejecutar las pruebas pertinentes, comprobar manualmente los comportamientos visuales cuando corresponda y comunicar qué quedó sin verificar. Un test aislado no demuestra que Pi funcione de extremo a extremo.

## Instalación y actualización del fork

- **Intención:** usar el checkout local como paquete de Pi, con directorio de agente configurable; preparar dependencias, runtime y complementos sin sustituirlo por `npm:gentle-pi`. Al terminar una instalación interactiva, abrir Pi para investigar paquetes adicionales y consultar antes de instalarlos; sin terminal interactiva, avisar que se omitió la revisión. `gentle-update` detecta releases estables y delega la actualización interactiva a Pi, sin modificar por sí mismo el historial ni publicar. La base se toma de la rama `release` (siempre un tag estable oficial), no de un tag inferido del historial: así el rebase `--onto` sigue la intención declarada en lugar de un merge explícito.
- **Superficies:** `custom/instalar-custom.mjs`, `custom/installer-followup.mjs`, `custom/pi-config.mjs`, `custom/actualizar-custom.mjs` y `custom/INSTRUCCIONES-IA.md`. Preservar los complementos y precauciones allí documentados, especialmente los datos de Engram.
- **Comprobación:** `node --test custom/*.test.mjs`; revisar registro de paquete y directorio de Pi, y validar el flujo interactivo y la instalación cuando sea posible. La instalación completa en una máquina limpia no está validada.

## Banner derivado del tema

- **Intención:** el banner de inicio toma su paleta del color de acento del tema activo, sin tabla de paletas por tema. En fondos claros el acento se mantiene plano y los tonos apagados se derivan como tintes pálidos; en fondos oscuros el acento se aclara hacia blanco. Si el tema no resuelve el acento a canales RGB, el banner conserva la paleta fija configurada como respaldo y el arranque no se rompe.
- **Superficies:** `extensions/startup-banner.ts`. Los temas Catppuccin **no** viven en este fork: se cargan desde los dotfiles del usuario (`~/.config/pi/themes/`).
- **Comprobación:** `tests/startup-banner.test.ts`; revisar manualmente el banner con un tema claro, con uno oscuro y con un tema cuyo acento no sea truecolor. Las pruebas automáticas no sustituyen la evaluación del contraste.

## Imágenes arrastradas desde la miniatura del screenshot

- **Intención:** arrastrar la miniatura del screenshot de macOS (⌘⇧4) al prompt debe producir un chip `[Image#N]` con su previsualización, no la ruta de `TemporaryItems` pegada como texto. Los espacios ASCII llegan escapados, pero macOS nombra el archivo `Screenshot … at 8.24.55\u202fPM.png` con U+202F (narrow no-break space) crudo: solo el espacio ASCII separa tokens, porque los terminales escapan exactamente esos y cualquier otro espacio es parte del nombre. Vale igual para un screenshot guardado en disco que se arrastra desde Finder. Es un fallo de upstream: si lo corrigen, retirar esta personalización.
- **Superficies:** `lib/pasted-image-paths.ts` (`TOKEN_SEPARATOR`). El chip, el registro y el envío siguen siendo los de upstream; no tocar `extensions/gentle-shell.ts`.
- **Comprobación:** `tests/pasted-image-paths.test.ts` (caso "macOS thumbnail" con archivo real de nombre U+202F), más `tests/image-paste-chips.test.ts` y los casos de chip en `tests/gentle-shell.test.ts`. La prueba automática no sustituye arrastrar de verdad desde la miniatura en la terminal que uses.

## Fuera de este fork

Varias personalizaciones se mudaron a la configuración de Pi (`~/.config/pi`), que Pi carga como assets propios y no requieren tocar este checkout:

- **Temas Catppuccin Latte y Mocha:** `~/.config/pi/themes/`, con su atribución.
- **Agent cards sobre el tema activo:** `~/.config/pi/extensions/theme-native-agent-cards.ts`.
- **Menú de autocompletado flotante:** `~/.config/pi/local/autocomplete-overlay/`, registrado al final de `packages` para envolver el editor de este fork.

Al cambiar cualquiera de esas piezas, la intención sigue siendo la misma: mantener el fork lo más cerca posible de upstream.

## Flujos de colaboración

- **Intención:** las skills de PR, issues y RDD deben seguir las reglas reales del repositorio de destino, sin imponer universalmente issue aprobado, etiqueta de tipo o autorización separada para cada operación necesaria cuando el usuario ya pidió crear una PR. Mantener la distinción entre preparar y publicar, y no inferir permiso para merge, acciones destructivas o comentarios no solicitados.
- **Superficies:** `skills/branch-pr/SKILL.md`, `skills/issue-creation/SKILL.md`, `skills/rdd-defect-workflow/SKILL.md`.
- **Comprobación:** `tests/branch-pr-skill.test.ts`, `tests/issue-creation-skill.test.ts`, `tests/rdd-defect-workflow-skill.test.ts`; revisar que cambios upstream de seguridad y autorización sigan respetándose y no se relajen accidentalmente.

## Ejecución de pruebas TypeScript

En esta versión pueden ejecutarse pruebas concretas con `node --experimental-strip-types --test tests/ARCHIVO.test.ts`; adaptar el comando si cambia el runner oficial. Para una actualización real, elegir además las comprobaciones de integración, runtime y pruebas completas según los cambios oficiales y registrar cualquier bloqueo.
