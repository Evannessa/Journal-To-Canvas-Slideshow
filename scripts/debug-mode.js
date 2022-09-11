export const MODULE_ID = "journal-to-canvas-slideshow";
import { SlideshowConfig } from "./SlideshowConfig.js";

Hooks.once("devModeReady", ({ registerPackageDebugFlag }) => {
    registerPackageDebugFlag(MODULE_ID);
});
Hooks.on("canvasReady", ({}) => {
    const isDebugging = game.modules.get("_dev-mode")?.api?.getPackageDebugValue(MODULE_ID);
    //re-render the tile config
    const appNames = {
        JTCSlideshowConfig: new SlideshowConfig(),
    };
    const appName = "JTCSlideshowConfig";
    if (game.user.isGM && isDebugging) {
        if (!game[appName]) game[appName] = appNames[appName]; //.render(true)
        game[appName].render(true);
        game.journal.getName("Art").sheet.render(true);
    }
});

export function log(force, ...args) {
    try {
        const isDebugging = game.modules.get("_dev-mode")?.api?.getPackageDebugValue(MODULE_ID);

        if (force || isDebugging) {
            console.log(MODULE_ID, "|", ...args);
        }
    } catch (e) {}
}

// ...
