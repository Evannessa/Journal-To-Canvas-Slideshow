export const MODULE_ID = "journal-to-canvas-slideshow";
import { SlideshowConfig } from "./SlideshowConfig.js";
// import { JTCSSettingsApplication } from "./classes/JTCSSettingsApplication.js";

Hooks.once("devModeReady", ({ registerPackageDebugFlag }) => {
    registerPackageDebugFlag(MODULE_ID);
});

Hooks.on("canvasReady", ({}) => {
    const isDebugging = game.modules.get("_dev-mode")?.api?.getPackageDebugValue(MODULE_ID);
    //re-render the tile config
    const autoRenderDocs = {
        journal: ["Art"],
    };
    const appNames = {
        JTCSlideshowConfig: new SlideshowConfig(),

        // JTCSSettingsApp: new JTCSSettingsApplication(),
    };
    if (game.user.isGM && isDebugging) {
        Object.keys(appNames).forEach((key) => {
            autoRenderApp(key, appNames[key]);
        });
        Object.keys(autoRenderDocs).forEach((collectionName) => {
            autoRenderDocs[collectionName].forEach((name) => {
                game[collectionName].getName(name).render();
            });
        });

        // if (!game[appName]) game[appName] = appNames[appName]; //.render(true)
        // game[appName].render(true);
        // game.journal.getName("Art").sheet.render(true);
    }
});
function autoRenderApp(appName, instance) {
    if (!game[appName]) game[appName] = instance;
    game[appName].render(true);
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
