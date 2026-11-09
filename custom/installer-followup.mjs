// Keep the assessment interactive and separate from package installation.
export function installationFollowup() {
	return ["--", `Acabo de preparar este checkout local de Gentle Shell para Pi. Lee custom/INSTRUCCIONES-IA.md y revisa la instalación y configuración activas. Averigua si hay paquetes adicionales necesarios o recomendables para esta instalación y explícame la evidencia y las opciones. No instales ni actualices ningún paquete sin mi confirmación expresa. No instales npm:gentle-pi ni sustituyas el checkout local. No modifiques, repares ni migres datos de Engram sin autorización explícita.`];
}
