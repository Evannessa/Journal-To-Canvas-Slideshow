export const MODULE_ID = "journal-to-canvas-slideshow";
import { SlideshowConfig } from "./SlideshowConfig.js";

Hooks.once("devModeReady", ({ registerPackageDebugFlag }) => {
    registerPackageDebugFlag("journal-to-canvas-slideshow");
});
Hooks.on("canvasReady", () => {
    // game.JTCSlideshowConfig = new SlideshowConfig().render(true);
    // autoRender(true, { type: "journal", name: "Art" });
});
export function autoRender(force, ...args) {
    try {
        const isDebugging = game.modules.get("_dev-mode")?.api?.getPackageDebugValue(MODULE_ID);

        if (force || isDebugging) {
            if (type === "journal") {
                game.journal.getName(name).sheet.render(true);
            }
        }
    } catch (e) {}
}

export function log(force, ...args) {
    try {
        const isDebugging = game.modules.get("_dev-mode")?.api?.getPackageDebugValue(MODULE_ID);

        if (force || isDebugging) {
            console.log(MODULE_ID, "|", ...args);
        }
    } catch (e) {}
}

// ...
