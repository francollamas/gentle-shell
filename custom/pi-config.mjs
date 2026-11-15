import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { isAbsolute, join } from "node:path";

// Pi uses PI_CODING_AGENT_DIR for its configuration, independently of where
// the executable lives. Use the personal XDG-style installation by default.
export function piConfig(env = process.env, home = homedir(), exists = existsSync) {
	const agentHome = env.PI_CODING_AGENT_DIR || join(home, ".config", "pi", "agent");
	if (!isAbsolute(agentHome)) throw new Error("PI_CODING_AGENT_DIR debe ser una ruta absoluta.");
	const managedPi = join(agentHome, "bin", "pi");
	return {
		agentHome,
		pi: exists(managedPi) ? managedPi : "pi",
		env: { ...env, PI_CODING_AGENT_DIR: agentHome },
	};
}
