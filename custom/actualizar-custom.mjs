#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { piConfig } from "./pi-config.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const config = piConfig();
const api = "https://api.github.com/repos/Gentleman-Programming/gentle-shell/releases";

function run(program, args, capture = false) {
	const result = spawnSync(program === "pi" ? config.pi : program, args, { cwd: root, env: config.env, encoding: "utf8", stdio: capture ? "pipe" : "inherit" });
	if (result.error || result.status !== 0) throw new Error(`${program} ${args.join(" ")}: ${result.error?.message || (capture ? result.stderr.trim() : `salió con código ${result.status}`)}`);
	return capture ? result.stdout.trim() : "";
}
function git(...args) { return run("git", args, true); }
function ancestor(a, b) {
	const result = spawnSync("git", ["merge-base", "--is-ancestor", a, b], { cwd: root });
	if (result.status === 0) return true;
	if (result.status === 1) return false;
	throw new Error("No se pudo comprobar la ascendencia de los tags.");
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
	if (git("branch", "--show-current") !== "custom") throw new Error("Debes estar en la rama custom.");
	const [latest, recent] = await Promise.all([releases("/latest"), releases("?per_page=100")]);
	if (latest.draft || latest.prerelease || !version(latest.tag_name) || !Array.isArray(recent)) throw new Error("GitHub no devolvió una release estable válida.");
	run("git", ["fetch", "upstream", "--tags"]);
	const target = latest.tag_name;
	git("rev-parse", "--verify", `refs/tags/${target}^{commit}`);
	const candidates = recent.filter(r => !r.draft && !r.prerelease && version(r.tag_name)).map(r => r.tag_name).sort(compare);
	const base = candidates.find(tag => {
		try { git("rev-parse", "--verify", `refs/tags/${tag}^{commit}`); } catch { return false; }
		return ancestor(`refs/tags/${tag}`, "HEAD");
	});
	if (!base) throw new Error("No se encontró una release estable oficial anterior en el historial; no se modificó la rama.");
	console.log(`Base detectada: ${base}. Última release estable: ${target}.`);
	if (base !== target) {
		if (!ancestor(`refs/tags/${base}`, `refs/tags/${target}`)) throw new Error("La base no es antecesora de la última release; actualización detenida.");
		if (!process.stdin.isTTY || !process.stdout.isTTY) throw new Error("Hay una nueva release, pero se necesita una terminal interactiva para abrir Pi.");
		const prompt = `Hay una nueva release estable oficial de Gentle Shell: ${target}. La base detectada de esta rama custom es ${base}.
Ayúdame interactivamente a actualizar mi fork a esa release, sin seguir upstream/main. Lee custom/INSTRUCCIONES-IA.md y las notas oficiales de la release. Comprueba el estado de Git, la identidad y ascendencia de ambos tags y mis commits personales. No descartes ni sobrescribas cambios; si hay trabajo sin guardar, detente y consulta cómo proceder.
Propón un rebase explícito de mis commits posteriores a ${base} sobre ${target} (git rebase --onto refs/tags/${target} refs/tags/${base} custom) y pide mi confirmación antes de ejecutarlo. Resuelve conflictos conmigo y conserva mis personalizaciones. Después del rebase, comprueba cambios y pruebas, prepara las dependencias y el runtime del checkout si corresponde, y verifica que Pi siga usando este checkout local. No instales la versión npm de gentle-pi. No hagas push ni force push sin pedirme confirmación expresa. Si hay un bloqueo, explícalo y espera mis instrucciones.`;
		console.log("Nueva release disponible. Abriendo Pi en modo interactivo; el script no hará el rebase.");
		run("pi", ["--", prompt]);
	} else console.log("La rama ya está basada en la última release estable. No hay nada que actualizar.");
} catch (error) {
	console.error(`actualizar-custom: ${error.message}`);
	process.exitCode = 1;
}
