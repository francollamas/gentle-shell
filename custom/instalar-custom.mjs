#!/usr/bin/env node
// First-time setup for the personal checkout; never rebases or modifies Engram data.
import { spawnSync } from "node:child_process";
import { existsSync, lstatSync, mkdirSync, readFileSync, readlinkSync, realpathSync, symlinkSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { piConfig } from "./pi-config.mjs";
import { installationFollowup } from "./installer-followup.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const config = piConfig();
const agentHome = config.agentHome;
const settingsPath = join(agentHome, "settings.json");
const link = join(homedir(), ".local", "bin", "gentle-update");
const target = join(root, "custom", "actualizar-custom.mjs");

function run(program, args, capture = false) {
	const result = spawnSync(program === "pi" ? config.pi : program, args, { cwd: root, env: config.env, encoding: "utf8", stdio: capture ? "pipe" : "inherit" });
	if (result.error || result.status !== 0) throw new Error(`${program} ${args.join(" ")}: ${result.error?.message || (capture ? result.stderr.trim() : `código ${result.status}`)}`);
	return capture ? result.stdout.trim() : "";
}
function sources() {
	const settings = existsSync(settingsPath) ? JSON.parse(readFileSync(settingsPath, "utf8")) : {};
	if (settings.packages !== undefined && !Array.isArray(settings.packages)) throw new Error(`Lista packages inválida: ${settingsPath}`);
	return (settings.packages || []).map(entry => typeof entry === "string" ? entry : entry?.source).filter(source => typeof source === "string");
}
function ensurePackage(name, spec = `npm:${name}`) {
	if (sources().some(source => source === `npm:${name}` || source.startsWith(`npm:${name}@`))) {
		console.log(`${name} ya está registrado; se conserva la versión configurada.`);
		return;
	}
	run("pi", ["install", spec]);
}
function linkCommand() {
	mkdirSync(dirname(link), { recursive: true });
	try {
		const stat = lstatSync(link);
		if (!stat.isSymbolicLink() || resolve(dirname(link), readlinkSync(link)) !== target) throw new Error(`${link} ya existe y apunta a otro destino; no se reemplazó.`);
		console.log(`Enlace existente: ${link}`);
	} catch (error) {
		if (error.code !== "ENOENT") throw error;
		symlinkSync(target, link);
		console.log(`Enlace creado: ${link}`);
	}
}

try {
	if (process.argv.length !== 2) throw new Error("Uso: ./custom/instalar-custom.mjs (sin argumentos)");
	console.log(`Directorio de Pi: ${agentHome}`);
	if (run("git", ["branch", "--show-current"], true) !== "custom") throw new Error("Cambia primero a la rama custom.");
	if (process.env.GENTLE_PI_SKIP_GENTLE_AI_INSTALL === "1") throw new Error("Desactiva GENTLE_PI_SKIP_GENTLE_AI_INSTALL antes de instalar.");
	// Tools and Engram itself are prerequisites; do not install system-wide software implicitly.
	for (const program of ["pi", "pnpm", "engram"]) run(program, ["--version"]);
	const configured = sources();
	if (configured.some(source => /^npm:gentle-pi(?:@|$)/.test(source))) throw new Error("Pi ya tiene npm:gentle-pi registrado; revisa la configuración antes de añadir el checkout.");
	let registered = false;
	for (const source of configured) {
		if (/^(npm:|git:|https?:)/.test(source)) continue;
		const path = isAbsolute(source) ? source : resolve(agentHome, source);
		if (!existsSync(join(path, "package.json"))) continue;
		if (JSON.parse(readFileSync(join(path, "package.json"), "utf8")).name !== "gentle-pi") continue;
		if (realpathSync(path) !== realpathSync(root)) throw new Error(`Pi ya tiene otro checkout de gentle-pi: ${path}`);
		registered = true;
	}
	linkCommand();
	run("pnpm", ["install", "--frozen-lockfile"]);
	run("node", ["scripts/install-gentle-ai.mjs"]);
	if (!registered) run("pi", ["install", root]);
	ensurePackage("pi-web-access");
	ensurePackage("pi-btw");
	// Pin before init: the initializer otherwise adds a second versioned entry.
	ensurePackage("gentle-engram", "npm:gentle-engram@0.4.2");
	const engramSources = sources().filter(source => /^npm:gentle-engram(?:@|$)/.test(source));
	if (engramSources.length !== 1 || engramSources[0] === "npm:gentle-engram") {
		console.warn("Engram tiene entradas duplicadas o sin versión. Se omite init para no añadir otra; revisa pi list y settings.json manualmente.");
	} else {
		const cli = join(agentHome, "npm", "node_modules", "gentle-engram", "cli.js");
		if (!existsSync(cli)) throw new Error(`No se encontró ${cli}; revisa la instalación de gentle-engram.`);
		const metadata = JSON.parse(readFileSync(join(dirname(cli), "package.json"), "utf8"));
		if (engramSources[0] !== `npm:gentle-engram@${metadata.version}`) throw new Error("La versión registrada de gentle-engram no coincide con la instalada; revisa pi list antes de init.");
		run("node", [cli, "init"]);
	}
	console.log("Instalación preparada. Reinicia Pi y comprueba la memoria. Ejecuta gentle-update para actualizar el checkout.");
	if (!process.env.PATH?.split(":").includes(dirname(link))) console.warn(`Añade ${dirname(link)} a PATH para usar gentle-update.`);
	if (process.stdin.isTTY && process.stdout.isTTY) {
		console.log("Abriendo Pi para revisar posibles paquetes adicionales.");
		run("pi", installationFollowup());
	} else {
		console.warn("No hay terminal interactiva: se omite la revisión de paquetes adicionales con Pi.");
	}
} catch (error) {
	console.error(`instalar-custom: ${error.message}`);
	process.exitCode = 1;
}
