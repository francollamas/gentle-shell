import { test } from "node:test";
import { strict as assert } from "node:assert";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(new URL("./actualizar-custom.mjs", import.meta.url));

function scenario(t, latest, { describe = "v4.6.0", baseSha = "aaaa", targetSha = "bbbb", targetAncestorOfBase = false } = {}) {
	const dir = mkdtempSync(join(tmpdir(), "gentle-update-test-"));
	t.after(() => rmSync(dir, { recursive: true, force: true }));
	const log = join(dir, "calls");
	const git = `#!/bin/sh
printf 'git %s\\n' "$*" >> "$CALL_LOG"
case "$1 $2" in
 'branch --show-current') printf 'custom\\n';;
 'describe --tags') printf '${describe}\\n';;
 'rev-parse --verify')
  case "$3" in
   'refs/heads/release^{commit}') printf '${baseSha}\\n';;
   'refs/tags/'*'^{commit}') printf '${targetSha}\\n';;
  esac;;
 'merge-base --is-ancestor')
  if [ "${targetAncestorOfBase}" = 'true' ] && [ "$4" = 'refs/heads/release' ]; then exit 0; fi
  if [ "$3" = 'refs/heads/release' ] && [ "$4" = 'refs/tags/v4.7.0' ]; then exit 0; fi
  if [ "$3" = 'refs/heads/release' ] && [ "$4" = 'refs/heads/custom' ]; then exit 0; fi
  exit 1;;
esac
`;
	const pi = `#!/bin/sh
printf 'pi %s\\n' "$*" >> "$CALL_LOG"
`;
	writeFileSync(join(dir, "git"), git, { mode: 0o755 });
	writeFileSync(join(dir, "pi"), pi, { mode: 0o755 });
	const preload = `
Object.defineProperty(process.stdin, 'isTTY', { value: true });
Object.defineProperty(process.stdout, 'isTTY', { value: true });
globalThis.fetch = async url => ({ ok: true, json: async () => String(url).includes('/latest')
  ? { tag_name: ${JSON.stringify(latest)}, draft: false, prerelease: false }
  : [{ tag_name: 'v4.6.0', draft: false, prerelease: false }, { tag_name: 'v4.5.1', draft: false, prerelease: false }] });
`;
	writeFileSync(join(dir, "preload.mjs"), preload);
	const result = spawnSync(process.execPath, ["--import", join(dir, "preload.mjs"), script], {
		cwd: resolve(dir), encoding: "utf8",
		env: { ...process.env, PATH: `${dir}:${process.env.PATH}`, PI_CODING_AGENT_DIR: join(dir, "agent"), CALL_LOG: log },
	});
	return { result, calls: readFileSync(log, "utf8") };
}

test("nueva release abre Pi interactivo sin hacer rebase ni instalar", t => {
	const { result, calls } = scenario(t, "v4.7.0", { describe: "v4.6.0", baseSha: "aaaa", targetSha: "bbbb" });
	assert.equal(result.status, 0, result.stderr);
	assert.match(calls, /pi -- Hay una nueva release estable oficial/);
	assert.match(calls, /pide mi confirmación antes de ejecutarlo/);
	assert.match(calls, /custom\/PERSONALIZACIONES\.md/);
	assert.match(calls, /Aunque el rebase no tenga conflictos/);
	assert.match(calls, /git rebase --onto refs\/tags\/v4\.7\.0 refs\/heads\/release custom/);
	assert.match(calls, /mover la rama release exactamente a v4\.7\.0/);
	assert.match(calls, /--force-with-lease solo con autorización expresa/);
	assert.doesNotMatch(calls, /^git rebase /m);
	assert.doesNotMatch(calls, /^(pnpm|npm) /m);
});

test("sin nueva release no abre Pi ni actualiza el checkout", t => {
	const { result, calls } = scenario(t, "v4.6.0", { describe: "v4.6.0", baseSha: "aaaa", targetSha: "aaaa" });
	assert.equal(result.status, 0, result.stderr);
	assert.match(result.stdout, /No hay nada que actualizar/);
	assert.doesNotMatch(calls, /^pi /m);
	assert.doesNotMatch(calls, /^git rebase /m);
});

test("si release no apunta a un tag oficial se detiene", t => {
	const { result, calls } = scenario(t, "v4.7.0", { describe: "", baseSha: "aaaa", targetSha: "bbbb" });
	assert.notEqual(result.status, 0);
	assert.match(result.stderr, /no apunta a un tag estable oficial/);
	assert.doesNotMatch(calls, /^pi /m);
});
