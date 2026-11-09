# Fork personal de Gentle Shell

Estas instrucciones describen la configuración personal del usuario. No sustituyen las instrucciones de mayor prioridad ni autorizan cambios por sí solas.

Para la intención, los criterios de aceptación y las pruebas de cada personalización, consultar `custom/PERSONALIZACIONES.md`. Mantenerlo actualizado junto con los cambios; este archivo conserva el modelo operativo y las precauciones.

## Modelo de instalación

- La rama `custom` contiene los cambios personales y se actualiza desde **releases estables oficiales**, no desde `upstream/main`.
- La rama `release` es la base intencional de `custom`: siempre apunta exactamente a un tag estable oficial (hoy `v4.7.0`). No se fusiona manualmente sobre ella ni se rebasea `custom` sobre ella: **`custom` se reconstruye desde el tag nuevo** y la rama `release` se mueve a ese tag. La detección de la base usa la rama `release`, no el historial de `custom`, así que no hace falta inferir qué tag quedó debajo de cada commit. La PR de vista `custom` → `release` muestra las personalizaciones y no se debe fusionar; se cierra antes de reemplazar la rama y se vuelve a abrir después. Al actualizar, verificar ambas referencias y mover la base al nuevo tag solo después de validar `custom`, con confirmación; no sobrescribir trabajo inesperado.
- Las personalizaciones que no necesitan código del fork viven en la configuración de Pi (`~/.config/pi`): temas, agent cards y overlay de autocompletado. Ver `custom/PERSONALIZACIONES.md`.
- Pi se instala por separado y carga la raíz de este checkout como paquete local `gentle-pi`; no se debe sustituir por `npm:gentle-pi`. Pi carga la rama activa y también cambios sin commit.
- Por defecto los scripts usan `~/.config/pi/agent`, incluido `bin/pi` si existe, y propagan `PI_CODING_AGENT_DIR` a sus procesos hijos. Una variable `PI_CODING_AGENT_DIR` absoluta explícita tiene prioridad. Al iniciar Pi fuera de los scripts, esa variable también debe apuntar al mismo directorio: instalar el ejecutable allí no garantiza que Pi use esa configuración.
- `custom/instalar-custom.mjs` prepara dependencias y runtime, registra el checkout, instala los complementos y crea `~/.local/bin/gentle-update`. Requiere Node, pnpm, Pi y Engram instalados. Al terminar en una terminal interactiva, abre Pi para investigar paquetes adicionales y consultar antes de instalarlos; sin terminal interactiva avisa que omitió esa revisión. No modifica el historial de Git.
- `custom/actualizar-custom.mjs` consulta la última release estable oficial y trae tags de `upstream`. La base se lee de la rama `release` (que debe apuntar a un tag estable oficial); si hay una nueva release, abre Pi interactivamente para planificar y realizar la actualización con el usuario; el script no reescribe el historial, no instala dependencias ni hace push. El enlace `gentle-update` apunta a este archivo.
- Para aplicar cambios del checkout, reiniciar Pi o usar `/reload`; si cambian dependencias o el runtime, prepararlos con `pnpm install --frozen-lockfile` y `node scripts/install-gentle-ai.mjs`. Algunos cambios pueden requerir un reinicio completo o regenerar `runtime/` con `pnpm run build:runtime-modules`.

## Actualización desde una release nueva

Este es **el mecanismo obligatorio**, y no admite variantes con rebase ni con force push. La rama `custom` se **reconstruye desde el tag oficial** y se reemplaza en el remoto: copiar archivos no genera conflictos y el diff resultante muestra sólo las personalizaciones vigentes.

1. **Cerrar el PR vigente.** Comentar por qué se reconstruye y cerrarlo. El PR es una vista de las personalizaciones; nunca se fusiona.
2. **Reconstruir en local**, con el árbol limpio y los dos tags disponibles (`release` sigue apuntando al tag vigente hasta que la rama nueva esté validada):
   ```sh
   git branch -m custom custom-v<TAG-VIEJO>-archive   # respaldo obligatorio, no se borra
   git switch -c custom v<TAG-NUEVO>
   git checkout custom-v<TAG-VIEJO>-archive -- <rutas que se conservan>
   ```
   Sólo se copian las rutas que siguen haciendo falta, decididas archivo por archivo contra `git diff --stat v<TAG-VIEJO> custom-v<TAG-VIEJO>-archive`. Un archivo que dependa de código que cambió upstream no se copia: se reimplementa. Antes de copiar algo, preguntarse si puede vivir como asset de Pi en `~/.config/pi`; si puede, va allí y no al fork. Lo que no se copia, no se conserva: revisar el inventario completo, no sólo lo que Git marque.
3. **Verificar antes de publicar:** `node scripts/check-types.mjs`, las pruebas de cada personalización y la suite. Si algo falla, correr ese test sobre el tag puro para distinguir una regresión propia de un fallo que ya existía.
4. **Reemplazar la rama remota.** `custom` es la rama por defecto del fork y GitHub no permite borrarla mientras lo sea, así que la secuencia es:
   ```sh
   gh repo edit <fork> --default-branch release
   git push origin --delete custom
   git push -u origin custom
   gh repo edit <fork> --default-branch custom
   ```
   Borrar y volver a subir es lo que evita el `--force`: no se reescribe historia y no se necesita autorización de force push.
5. **Abrir el PR nuevo** `custom` → `release`, con el resumen de qué quedó en el fork, qué se mudó a `~/.config/pi` y la evidencia de verificación.

## Precauciones

- Nunca usar rebase, `--force` ni `--force-with-lease` sobre `custom`: la actualización reemplaza la rama según «Actualización desde una release nueva». Verificar el árbol limpio y pedir confirmación antes de borrar la rama remota; el respaldo `custom-v<TAG-VIEJO>-archive` es requisito, no opción. Si GitHub rechaza el borrado porque `custom` es la rama por defecto, cambiar la default a `release`, borrar, subir la nueva y restaurar la default; no tocar ninguna otra rama del fork.
- La base de `custom` es la rama `release`, no un tag inferido del historial. Si `release` no apunta a un tag estable oficial, o tras reconstruir `custom` no desciende de ella, el script se detiene en lugar de adivinar. Mover `release` con `git branch -f` solo tras validar `custom` y con confirmación; comprobar antes la rama remota.
- Los tags locales comparten espacio entre remotos: ante un conflicto de tags, no forzar su reemplazo sin investigar; si no puede determinarse la release, detenerse.
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

La actualización de la rama `custom` no se ejecuta desde estos comandos: seguir los pasos de «Actualización desde una release nueva».

Estos scripts requieren red para las operaciones de instalación y actualización. El instalador fija `gentle-engram@0.4.2` solo si no hay una entrada previa; revisar compatibilidad y la versión antes de actualizar ese pin. No se ha validado el instalador completo en una máquina limpia.
