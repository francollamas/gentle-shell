#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const api = "https://api.github.com/repos/Gentleman-Programming/gentle-shell/releases";

function run(program, args, capture = false) {
	const result = spawnSync(program, args, { cwd: root, encoding: "utf8", stdio: capture ? "pipe" : "inherit" });
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
function registerPi() {
	const home = process.env.PI_CODING_AGENT_DIR || join(homedir(), ".pi", "agent");
	const settingsPath = join(home, "settings.json");
	const settings = existsSync(settingsPath) ? JSON.parse(readFileSync(settingsPath, "utf8")) : {};
	const packages = settings.packages ?? [];
	if (!Array.isArray(packages)) throw new Error(`La lista de paquetes en ${settingsPath} no es válida.`);
	let registered = false;
	for (const entry of packages) {
		const source = typeof entry === "string" ? entry : entry?.source;
		if (typeof source !== "string") continue;
		if (/^npm:gentle-pi(?:@|$)/.test(source)) throw new Error("Pi ya tiene npm:gentle-pi configurado. Revisa pi list y elimina esa entrada manualmente antes de continuar para evitar duplicados.");
		if (/^(npm:|git:|https?:)/.test(source)) continue;
		const path = isAbsolute(source) ? source : resolve(home, source);
		if (!existsSync(join(path, "package.json"))) continue;
		const metadata = JSON.parse(readFileSync(join(path, "package.json"), "utf8"));
		if (metadata.name !== "gentle-pi") continue;
		if (realpathSync(path) !== realpathSync(root)) throw new Error(`Pi ya tiene otro checkout de gentle-pi: ${path}. Revísalo antes de continuar.`);
		registered = true;
	}
	if (!registered) run("pi", ["install", root]);
}

try {
	if (process.argv.length !== 2) throw new Error("Uso: ./actualizar-custom.mjs (sin argumentos)");
	if (git("branch", "--show-current") !== "custom") throw new Error("Debes estar en la rama custom.");
	if (process.env.GENTLE_PI_SKIP_GENTLE_AI_INSTALL === "1") throw new Error("Desactiva GENTLE_PI_SKIP_GENTLE_AI_INSTALL antes de continuar.");
	run("pi", ["--version"]);
	run("pnpm", ["--version"]);
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
		if (git("status", "--porcelain")) throw new Error("Hay cambios sin guardar. Haz commit o guarda tus cambios antes del rebase.");
		if (!ancestor(`refs/tags/${base}`, `refs/tags/${target}`)) throw new Error("La base no es antecesora de la última release; rebase cancelado.");
		run("git", ["rebase", "--onto", `refs/tags/${target}`, `refs/tags/${base}`, "custom"]);
	} else console.log("La rama ya está basada en la última release estable.");
	run("pnpm", ["install", "--frozen-lockfile"]);
	run("node", ["scripts/install-gentle-ai.mjs"]);
	registerPi();
	console.log("Listo. Reinicia Pi o usa /reload. Si hubo rebase, revisa y publica con git push --force-with-lease origin custom.");
} catch (error) {
	console.error(`actualizar-custom: ${error.message}`);
	console.error("Si el rebase quedó en conflicto, resuélvelo con git rebase --continue o cancélalo con git rebase --abort; después vuelve a ejecutar este comando.");
	process.exitCode = 1;
}
