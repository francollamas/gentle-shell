#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { piConfig } from "./pi-config.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const config = piConfig();
const api = "https://api.github.com/repos/Gentleman-Programming/gentle-shell/releases";
const baseBranch = "release";
const customBranch = "custom";

function run(program, args, capture = false) {
	const result = spawnSync(program === "pi" ? config.pi : program, args, { cwd: root, env: config.env, encoding: "utf8", stdio: capture ? "pipe" : "inherit" });
	if (result.error || result.status !== 0) throw new Error(`${program} ${args.join(" ")}: ${result.error?.message || (capture ? result.stderr.trim() : `salió con código ${result.status}`)}`);
	return capture ? result.stdout.trim() : "";
}
function git(...args) { return run("git", args, true); }
function commit(ref) { return git("rev-parse", "--verify", `${ref}^{commit}`); }
function ancestor(a, b) {
	const result = spawnSync("git", ["merge-base", "--is-ancestor", a, b], { cwd: root });
	if (result.status === 0) return true;
	if (result.status === 1) return false;
	throw new Error("No se pudo comprobar la ascendencia de las referencias.");
}
async function releases(path) {
	const response = await fetch(`${api}${path}`, { headers: { "Accept": "application/vnd.github+json", "User-Agent": "gentle-shell-custom" }, signal: AbortSignal.timeout(15000) });
	if (!response.ok) throw new Error(`GitHub respondió ${response.status}; no se puede comprobar la release estable.`);
	return response.json();
}
function version(tag) { return /^v(\d+)\.(\d+)\.(\d+)$/.exec(tag)?.slice(1).map(Number); }
function compare(a, b) {
	const x = version(a), y = version(b);
	return y[0] - x[0] || y[1] - x[1] || y[2] - x[2];
}
try {
	if (process.argv.length !== 2) throw new Error("Uso: ./actualizar-custom.mjs (sin argumentos)");
	console.log(`Directorio de Pi: ${config.agentHome}`);
	if (git("branch", "--show-current") !== customBranch) throw new Error(`Debes estar en la rama ${customBranch}.`);
	// La rama release es la intención declarada de la base: siempre apunta a un tag oficial.
	const baseTag = `${baseBranch} ~ ${commit(`refs/heads/${baseBranch}`)}`;
	const baseTagName = git("describe", "--tags", "--exact-match", "refs/heads/release");
	if (!version(baseTagName)) throw new Error(`La rama ${baseBranch} no apunta a un tag estable oficial (${baseTag}); actualización detenida.`);
	const [latest, recent] = await Promise.all([releases("/latest"), releases("?per_page=100")]);
	if (latest.draft || latest.prerelease || !version(latest.tag_name) || !Array.isArray(recent)) throw new Error("GitHub no devolvió una release estable válida.");
	run("git", ["fetch", "upstream", "--tags"]);
	const target = latest.tag_name;
	const targetCommit = commit(`refs/tags/${target}`);
	const baseCommit = commit(`refs/heads/${baseBranch}`);
	console.log(`Base (rama ${baseBranch}): ${baseTagName}. Última release estable: ${target}.`);
	if (baseCommit !== targetCommit) {
		if (!ancestor(`refs/heads/${baseBranch}`, `refs/tags/${target}`)) throw new Error(`La rama ${baseBranch} no es antecesora de la última release; actualización detenida.`);
		if (ancestor(`refs/tags/${target}`, `refs/heads/${customBranch}`)) throw new Error(`La rama ${customBranch} ya contiene ${target}; revisa por qué ${baseBranch} no apunta a esa release.`);
		if (!ancestor(`refs/heads/${baseBranch}`, `refs/heads/${customBranch}`)) throw new Error(`La rama ${customBranch} no desciende de ${baseBranch}; verifica la intención de la base antes de continuar.`);
		if (!process.stdin.isTTY || !process.stdout.isTTY) throw new Error("Hay una nueva release, pero se necesita una terminal interactiva para abrir Pi.");
		const prompt = `Hay una nueva release estable oficial de Gentle Shell: ${target}. La base intencional de esta rama ${customBranch} es la rama ${baseBranch}, que hoy apunta a ${baseTagName} (${baseCommit}).
Ayúdame interactivamente a actualizar mi fork a esa release, sin seguir upstream/main. Lee custom/INSTRUCCIONES-IA.md, custom/PERSONALIZACIONES.md y las notas oficiales de la release. Compara los cambios oficiales entre ambos tags y el diff de mis personalizaciones. Comprueba el estado de Git, la identidad y ascendencia de ambos tags, mis commits personales y el estado local y remoto de ${baseBranch} y de la PR ${customBranch} → ${baseBranch}. No descartes ni sobrescribas cambios; si hay trabajo sin guardar, detente y consulta cómo proceder.
Propón un rebase explícito de mis commits posteriores a ${baseBranch} sobre ${target} (git rebase --onto refs/tags/${target} refs/heads/${baseBranch} ${customBranch}) y pide mi confirmación antes de ejecutarlo. Resuelve conflictos conmigo. Aunque el rebase no tenga conflictos, revisa cada intención y criterio de custom/PERSONALIZACIONES.md frente a la nueva versión, adapta la implementación y las pruebas si hace falta y consulta decisiones ambiguas o incompatibilidades. Actualiza el inventario cuando cambie una personalización; no declares compatibilidad solo porque el merge o rebase terminó bien.
Después comprueba el diff frente a ${target}, ejecuta las pruebas relevantes e informa resultados y verificaciones pendientes; prepara las dependencias y el runtime del checkout si corresponde y verifica que Pi siga usando este checkout local. No instales la versión npm de gentle-pi. Solo tras validar ${customBranch}, propón mover la rama ${baseBranch} exactamente a ${target} (git branch -f ${baseBranch} refs/tags/${target}); comprueba antes que la rama base local y remota estén donde se espera y no contengan trabajo ajeno. Si no es un avance rápido o hay divergencias, detente y consulta. Pide confirmación expresa antes de mover la rama base y antes de publicar cada rama; el rebase puede requerir force push de ${customBranch}, usa --force-with-lease solo con autorización expresa y tras comprobar la referencia remota. Advierte que la PR puede mostrar un diff transitorio mientras se publican ambas ramas y verifica después su base, head y diff. No hagas push ni force push sin pedirme confirmación expresa. Si hay un bloqueo, explícalo y espera mis instrucciones.`;
		console.log(`Nueva release disponible. Abriendo Pi en modo interactivo; el script no hará el rebase.`);
		run("pi", ["--", prompt]);
	} else console.log(`${baseBranch} ya apunta a la última release estable (${target}). No hay nada que actualizar.`);
} catch (error) {
	console.error(`actualizar-custom: ${error.message}`);
	process.exitCode = 1;
}
