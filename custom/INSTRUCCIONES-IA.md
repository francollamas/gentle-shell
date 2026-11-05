# Fork personal de Gentle Shell

Estas instrucciones describen la configuración personal del usuario. No sustituyen las instrucciones de mayor prioridad ni autorizan cambios por sí solas.

Para la intención, los criterios de aceptación y las pruebas de cada personalización, consultar `custom/PERSONALIZACIONES.md`. Mantenerlo actualizado junto con los cambios; este archivo conserva el modelo operativo y las precauciones.

## Modelo de instalación

- La rama `custom` contiene los cambios personales y se actualiza desde **releases estables oficiales**, no desde `upstream/main`.
- `custom-base` apunta al tag estable sobre el que se validó `custom`. La PR permanente `custom` → `custom-base` es una vista de las personalizaciones, no se debe fusionar. Al actualizar, verificar ambas referencias y actualizar la base al nuevo tag solo después de adaptar y validar `custom`, con confirmación; no sobrescribir trabajo inesperado. Las publicaciones pueden mostrar un diff transitorio en la PR.
- Pi se instala por separado y carga la raíz de este checkout como paquete local `gentle-pi`; no se debe sustituir por `npm:gentle-pi`. Pi carga la rama activa y también cambios sin commit.
- Por defecto los scripts usan `~/.config/pi/agent`, incluido `bin/pi` si existe, y propagan `PI_CODING_AGENT_DIR` a sus procesos hijos. Una variable `PI_CODING_AGENT_DIR` absoluta explícita tiene prioridad. Al iniciar Pi fuera de los scripts, esa variable también debe apuntar al mismo directorio: instalar el ejecutable allí no garantiza que Pi use esa configuración.
- `custom/instalar-custom.mjs` prepara dependencias y runtime, registra el checkout, instala los complementos y crea `~/.local/bin/gentle-update`. Requiere Node, pnpm, Pi y Engram instalados. Al terminar en una terminal interactiva, abre Pi para investigar paquetes adicionales y consultar antes de instalarlos; sin terminal interactiva avisa que omitió esa revisión. No modifica el historial de Git.
- `custom/actualizar-custom.mjs` consulta la última release estable oficial y trae tags de `upstream`. Si hay una nueva release, abre Pi interactivamente para planificar y realizar la actualización con el usuario; el script no hace rebase, instala dependencias ni hace push. El enlace `gentle-update` apunta a este archivo.
- Para aplicar cambios del checkout, reiniciar Pi o usar `/reload`; si cambian dependencias o el runtime, prepararlos con `pnpm install --frozen-lockfile` y `node scripts/install-gentle-ai.mjs`. Algunos cambios pueden requerir un reinicio completo o regenerar `runtime/` con `pnpm run build:runtime-modules`.

## Precauciones

- No ejecutar un rebase con cambios sin guardar ni publicar sin autorización. El agente debe verificar el árbol y pedir confirmación antes del rebase; en caso de conflicto, resolver con el usuario mediante `git rebase --continue` o `git rebase --abort`. Un force push de `custom` requiere autorización expresa y `--force-with-lease` después de comprobar el remoto; si hay divergencias inesperadas, detenerse.
- Los tags locales comparten espacio entre remotos: ante un conflicto de tags, no forzar su reemplazo sin investigar. El script identifica la base entre las últimas 100 releases oficiales; si no puede determinarla se detiene.
- El checkout local es una ruta absoluta en la configuración de Pi y en el enlace simbólico. Si se mueve, actualizar ambos cuidadosamente; el instalador no sobrescribe un enlace existente a otro destino.
- Complementos deseados: `pi-web-access`, `pi-btw` y `gentle-engram`. Engram usa herramientas nativas `mem_*`; no añadir otro MCP de Engram sin evaluar duplicación. El instalador conserva versiones existentes y evita ejecutar `pi-engram init` si detecta entradas duplicadas o sin versión.
- Se observó un diagnóstico Engram con destino `cloud:example` y siete mutaciones pendientes. No eliminar, reparar ni migrar datos de Engram sin investigar y contar con autorización explícita.
- El instalador oficial y `gentle-shell upgrade` no son el mecanismo de actualización del fork. Antes de ejecutarlos, revisar sus efectos para no reemplazar el checkout o su registro en Pi.

## Comandos

```sh
./custom/instalar-custom.mjs  # primera instalación o preparación
gentle-update                 # comprobar release; abrir Pi si hay una nueva
pi list                       # comprobar paquetes registrados
```

Estos scripts requieren red para las operaciones de instalación y actualización. El instalador fija `gentle-engram@0.4.2` solo si no hay una entrada previa; revisar compatibilidad y la versión antes de actualizar ese pin. No se ha validado el instalador completo en una máquina limpia.
