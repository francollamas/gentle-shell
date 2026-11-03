# Fork personal de Gentle Shell

Estas instrucciones describen la configuración personal del usuario. No sustituyen las instrucciones de mayor prioridad ni autorizan cambios por sí solas.

## Modelo de instalación

- La rama `custom` contiene los cambios personales y se actualiza desde **releases estables oficiales**, no desde `upstream/main`.
- Pi se instala por separado y carga la raíz de este checkout como paquete local `gentle-pi`; no se debe sustituir por `npm:gentle-pi`. Pi carga la rama activa y también cambios sin commit.
- `custom/instalar-custom.mjs` prepara dependencias y runtime, registra el checkout, instala los complementos y crea `~/.local/bin/gentle-update`. Requiere Node, pnpm, Pi y Engram instalados. No modifica el historial de Git.
- `custom/actualizar-custom.mjs` consulta la última release estable oficial, trae tags de `upstream`, hace rebase de `custom` si corresponde y prepara dependencias/runtime. El enlace `gentle-update` apunta a este archivo. No hace push ni actualiza los complementos de Pi.
- Para aplicar cambios del checkout, reiniciar Pi o usar `/reload`; los cambios en dependencias pueden requerir `gentle-update`. Algunos cambios pueden requerir un reinicio completo o regenerar `runtime/` con `pnpm run build:runtime-modules`.

## Precauciones

- No ejecutar un rebase con cambios sin guardar ni publicar con force push sin autorización. El script pide árbol limpio para el rebase; en caso de conflicto, resolver con `git rebase --continue` o cancelar con `git rebase --abort` y después ejecutar `gentle-update`.
- Los tags locales comparten espacio entre remotos: ante un conflicto de tags, no forzar su reemplazo sin investigar. El script identifica la base entre las últimas 100 releases oficiales; si no puede determinarla se detiene.
- El checkout local es una ruta absoluta en la configuración de Pi y en el enlace simbólico. Si se mueve, actualizar ambos cuidadosamente; el instalador no sobrescribe un enlace existente a otro destino.
- Complementos deseados: `pi-web-access`, `pi-btw` y `gentle-engram`. Engram usa herramientas nativas `mem_*`; no añadir otro MCP de Engram sin evaluar duplicación. El instalador conserva versiones existentes y evita ejecutar `pi-engram init` si detecta entradas duplicadas o sin versión.
- Se observó un diagnóstico Engram con destino `cloud:example` y siete mutaciones pendientes. No eliminar, reparar ni migrar datos de Engram sin investigar y contar con autorización explícita.
- El instalador oficial y `gentle-shell upgrade` no son el mecanismo de actualización del fork. Antes de ejecutarlos, revisar sus efectos para no reemplazar el checkout o su registro en Pi.

## Comandos

```sh
./custom/instalar-custom.mjs  # primera instalación o preparación
gentle-update                 # nueva release y preparación local
pi list                       # comprobar paquetes registrados
```

Estos scripts requieren red para las operaciones de instalación y actualización. El instalador fija `gentle-engram@0.4.2` solo si no hay una entrada previa; revisar compatibilidad y la versión antes de actualizar ese pin. No se ha validado el instalador completo en una máquina limpia.
