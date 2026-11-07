import { truncateToWidth, visibleWidth, type Component, type OverlayHandle, type TUI } from "@earendil-works/pi-tui";
import { rearmPromptBackground } from "./shell-prompt.ts";

// Adapted from pi-autocomplete-overlay, MIT; see lib/PI-AUTOCOMPLETE-LICENSE.txt.
export class AutocompleteOverlay {
	private lines: string[] = [];
	private handle?: OverlayHandle;
	private bottom?: number;
	private width?: number;
	private left?: number;
	private inset = 0;
	private readonly component: Component = {
		render: (width) => this.lines.map((line) => {
			const clipped = truncateToWidth(" ".repeat(this.inset) + line, width, "");
			const padded = clipped + " ".repeat(Math.max(0, width - visibleWidth(clipped)));
			const marker = this.background("");
			const prefix = marker.match(/^((?:\x1b\[[\d;]*m)+)\x1b\[49m$/)?.[1];
			return this.background(prefix ? rearmPromptBackground(padded, prefix) : padded);
		}),
		invalidate: () => {},
	};

	private readonly tui: TUI;
	private readonly editorFocused: () => boolean;
	private readonly background: (text: string) => string;
	constructor(tui: TUI, editorFocused: () => boolean, background: (text: string) => string) {
		this.tui = tui; this.editorFocused = editorFocused; this.background = background;
	}

	show(lines: string[], editorHeight: number, width: number, left: number, inset: number): boolean {
		if (typeof this.tui.showOverlay !== "function" || lines.length === 0) return false;
		const bottom = editorHeight + 1;
		try {
			if (this.handle && (this.bottom !== bottom || this.width !== width || this.left !== left)) this.dispose();
			this.lines = lines;
			this.inset = inset;
			if (!this.handle) {
				this.handle = this.tui.showOverlay(this.component, {
					anchor: "bottom-left", width, margin: { bottom, left }, nonCapturing: true,
					visible: () => this.editorFocused(),
				});
				this.bottom = bottom;
				this.width = width;
				this.left = left;
			}
			this.handle.setHidden(false);
			return true;
		} catch {
			this.dispose();
			return false;
		}
	}

	hide(): void { this.handle?.setHidden(true); }
	dispose(): void {
		this.handle?.hide();
		this.handle = undefined;
		this.bottom = undefined;
		this.width = undefined;
		this.left = undefined;
		this.lines = [];
	}
}
