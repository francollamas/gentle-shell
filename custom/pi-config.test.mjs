import { strict as assert } from "node:assert";
import { test } from "node:test";
import { piConfig } from "./pi-config.mjs";

test("usa la instalación personal y propaga el directorio a Pi", () => {
	const result = piConfig({ PATH: "/bin" }, "/home/test", path => path === "/home/test/.config/pi/agent/bin/pi");
	assert.equal(result.agentHome, "/home/test/.config/pi/agent");
	assert.equal(result.pi, "/home/test/.config/pi/agent/bin/pi");
	assert.equal(result.env.PI_CODING_AGENT_DIR, result.agentHome);
});

test("respeta una ruta explícita y usa pi en PATH si no hay ejecutable local", () => {
	const result = piConfig({ PI_CODING_AGENT_DIR: "/otro/pi" }, "/home/test", () => false);
	assert.equal(result.agentHome, "/otro/pi");
	assert.equal(result.pi, "pi");
	assert.equal(result.env.PI_CODING_AGENT_DIR, "/otro/pi");
});

test("rechaza rutas explícitas relativas", () => {
	assert.throws(() => piConfig({ PI_CODING_AGENT_DIR: "relativo" }, "/home/test"), /ruta absoluta/);
});
