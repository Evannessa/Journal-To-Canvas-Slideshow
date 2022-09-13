import { JTCSModules } from "./init.js";
/**
 * This sets up most hooks we want to respond to in our code,
 * grouping hooks with identical
 * callbacks into arrays on an object
 * @returns object containing registerHooks function
 */
export const setupHookHandlers = async () => {
    async function renderSlideshowConfig() {
        if (game.JTCSlideshowConfig && game.JTCSlideshowConfig.rendered) {
            game.JTCSlideshowConfig.render(false);
        }
    }
    /**
     * Show a toggle in the journal sheet's header to toggle whether the journal
     * has controls on or off
     */
    async function renderSheetHeaderButton(app, html) {
        //get the global toggle "all sheets" or "toggle individual"
        let settingsToggle = JTCSModules.HelperFunctions.getSettingValue(
            "artGallerySettings",
            "sheetSettings.globalChoices.chosen"
        );
        //get the modular toggle for "journal sheets", "actor sheets", "item sheets"
        //this will be an array
        let individualToggles = JTCSModules.HelperFunctions.getSettingValue(
            "artGallerySettings",
            "sheetSettings.modularChoices"
        );
    }
    async function renderImageControls(app, html) {
        if (!game.user.isGM) {
            return;
        }
        await JTCSModules.SheetImageApp.applyImageClasses(app, html);
    }

    async function updateGalleryTileIndicator(tileDoc) {
        let tileID = tileDoc.id;
        let sceneTiles = await JTCSModules.ArtTileManager.getSceneSlideshowTiles("", true);
        let foundTileData = await JTCSModules.ArtTileManager.getTileDataFromFlag(tileID, sceneTiles);
        await JTCSModules.CanvasIndicators.setUpIndicators(foundTileData, tileDoc);
    }

    async function updateAllGalleryIndicators(scene) {
        let tiles = scene.tiles;
        let artTileDataArray = await JTCSModules.ArtTileManager.getSceneSlideshowTiles("", true);
        tiles.forEach(async (tileDoc) => {
            let foundTileData = artTileDataArray.find((tileData) => tileData.id === tileDoc.id);
            await JTCSModules.CanvasIndicators.setUpIndicators(foundTileData, tileDoc);
        });
    }

    async function addJTCSControls(controls) {
        if (!game.user.isGM) {
            return;
        }
        const tileControls = controls.find((control) => control?.name === "tiles");

        tileControls.tools.push({
            name: "ShowJTCSConfig",
            title: "Show Slideshow Config",
            icon: "far fa-image",
            onClick: () => {
                new JTCSModules.SlideshowConfig().render(true);
            },
            button: true,
        });
        //push the clear display button regardless of what setting is selected
        tileControls.tools.push({
            name: "ClearDisplay",
            title: "ClearDisplay",
            icon: "fas fa-times-circle",
            onClick: () => {
                determineWhatToClear();
            },
            button: true,
        });
    }

    const hookHandlers = {
        renderImageControls: {
            hooks: ["renderItemSheet", "renderActorSheet", "renderJournalSheet"],
            handlerFunction: renderImageControls,
        },
        renderSlideshowConfig: {
            hooks: [
                "createTile",
                "updateTile",
                "deleteTile",
                "canvasReady",
                "createJournalEntry",
                "updateJournalEntry",
                "deleteJournalEntry",
                "updateJTCSSettings",
            ],
            handlerFunction: renderSlideshowConfig,
        },
        updateCanvasIndicators: {
            hooks: ["createTile", "updateTile", "deleteTile"],
            handlerFunction: updateGalleryTileIndicator,
            specialHooks: [
                {
                    hookName: "canvasReady",
                    handlerFunction: async (canvas) => {
                        updateAllGalleryIndicators(canvas.scene);
                    },
                },
                {
                    hookName: "updateJTCSSettings",
                    handlerFunction: async () => {
                        let scene = game.scenes.viewed;
                        await updateAllGalleryIndicators(scene);
                    },
                },
                {
                    hookName: "updateArtGalleryTiles",
                    handlerFunction: async (scene) => {
                        scene = game.scenes.viewed;
                        await updateAllGalleryIndicators(scene);
                    },
                },
            ],
        },
        addJTCSControls: {
            hooks: ["getSceneControlButtons"],
            handlerFunction: addJTCSControls,
        },
    };

    async function registerHooks() {
        for (let handlerKey in hookHandlers) {
            let handler = hookHandlers[handlerKey];
            if (handler.specialHooks) {
                handler.specialHooks.forEach((specialHookData) => {
                    let { hookName, handlerFunction: callback } = specialHookData;
                    Hooks.on(hookName, callback);
                });
            }
            for (let hookName of handler.hooks) {
                Hooks.on(hookName, handler.handlerFunction);
            }
        }
    }
    return {
        registerHooks: registerHooks,
    };
};
