import { strict as assert } from "node:assert";
import { test } from "node:test";
import { AutocompleteOverlay } from "../lib/autocomplete-overlay.ts";

test("overlay aligns with prompt, reapplies the theme background after SGR resets and tracks resize", () => {
	let component: { render(width: number): string[] } | undefined;
	const options: any[] = [];
	let removed = 0;
	const tui = { showOverlay(value: typeof component, opts: unknown) {
		component = value; options.push(opts);
		return { setHidden() {}, hide() { removed++; } };
	} };
	const background = (text: string) => `\x1b[48;2;49;50;68m${text}\x1b[49m`;
	const overlay = new AutocompleteOverlay(tui as never, () => true, background);
	assert.equal(overlay.show(["\x1b[31mname\x1b[0m description"], 3, 40, 1, 2), true);
	assert.equal(options[0].width, 40);
	assert.equal(options[0].margin.left, 1);
	const line = component!.render(40)[0];
	assert.match(line, /^\x1b\[48;2;49;50;68m  /);
	assert.match(line, /\x1b\[0m\x1b\[48;2;49;50;68m description/);
	assert.equal(overlay.show(["new"], 3, 30, 1, 2), true);
	assert.equal(removed, 1);
	assert.equal(options[1].width, 30);
	overlay.dispose();
	assert.equal(removed, 2);
});
