import { JTCSModules } from "./init.js";
import { HelperFunctions } from "./classes/HelperFunctions.js";
import { ArtTileManager } from "./classes/ArtTileManager.js";
/**
 * This sets up most hooks we want to respond to in our code,
 * grouping hooks with identical
 * callbacks into arrays on an object
 * @returns object containing registerHooks function
 */
export const setupHookHandlers = async () => {
    async function renderSlideshowConfig(...args) {
        if (args[2]?.diff && args[1]?.alpha) {
            //TODO: ? this was a workaround for v10, keeping Scene Gallery Config from re-rendering on update of tile alpha, but should remove
            //don't update if the changes include alpha
            return;
        }
        if (game.JTCSlideshowConfig && game.JTCSlideshowConfig.rendered) {
            game.JTCSlideshowConfig.render(false);
        }
    }

    /**
     * Show a toggle in the journal sheet's header to toggle whether the journal
     * has controls on or off
     */

    async function renderImageControls(app, html) {
        console.log("Renderingg image controls", app, html)
        if (!game.user.isGM) {
            return;
        }

        await JTCSModules.SheetImageApp.applyImageClasses(app, html);
    }

    async function updateGalleryTileIndicator(tileDoc) {
        let tileID = tileDoc.id; //this gets the id from the tile's document itself
        let sceneGalleryTiles = await JTCSModules.ArtTileManager.getSceneSlideshowTiles(
            "",
            true
        );
        let foundTileData = await JTCSModules.ArtTileManager.getTileDataFromFlag(
            tileID,
            sceneGalleryTiles
        ); //this is looking for tiles that are already linked

        await JTCSModules.CanvasIndicators.setUpIndicators(foundTileData, tileDoc);
    }

    async function updateAllGalleryIndicators(scene) {
        let tiles = scene.tiles;
        let artTileDataArray = await JTCSModules.ArtTileManager.getSceneSlideshowTiles(
            "",
            true
        );
        tiles.forEach(async (tileDoc) => {
            let foundTileData = artTileDataArray.find(
                (tileData) => tileData.id === tileDoc.id
            );
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
        tileControls.tools.push({
            name: "ShowSheetCSConfig",
            title: "Show Sheet Config",
            icon: "far fa-image",
            onClick: () => {
                new JTCSModules.SheetConfigApp().render(true);
            },
            button: true,
        });
    }
    /**
     * Re render the image sheet for fresh controls whenever the JTCSSettings, or the SlideshowConfig data for the current scene (individual tile data or the default tile, for instance) is updated
     * @param {Object} options - option arguments to be passed to this
     * @param {String} options.origin - the origin of the Hook - was it the settings, or a flag update for the current scene's slideshow settings?
     * @param {Object} options.currentScene - the scene, usually the current scene
     * @param {String} options.tileID - the ID of the tile, if updated
     */
    function rerenderImageSheet(options) {
        const { origin, currentScene, updateData } = options;

        let renderedSheets = Object.values(window.ui.windows).filter(
            (item) => item.document?.documentName
        );
        renderedSheets.forEach((sheet) => {
            const docType = sheet.document.documentName.toLowerCase();

            //if our type of document is set to "true" as rendering controls in the settings
            //and it's not currently being edited
            //and we're not telling it to render anyway
            let editorsActive = HelperFunctions.editorsActive(sheet);
            if (editorsActive !== true) {
                sheet.render();
            }
        });
    }

    const hookHandlers = {
        rerenderImageSheet: {
            //when the art gallery tiles update, re-render the sheets
            hooks: [
                "updateArtGalleryTiles",
                "updateDefaultArtTile",
                "updateJTCSSettings",
                "canvasReady",
            ],
            handlerFunction: rerenderImageSheet,
        },
        renderImageControls: {
            hooks: [
                "renderItemSheet",
                "renderActorSheet",
                "renderJournalSheet",
                "renderJournalPageSheet",
                "renderEnhancedJournalSheet",
                "getDocumentSheetHeaderButtons",
                "update",
            ],
            // hooks: ["renderJournalSheet"],
            handlerFunction: renderImageControls,
        },
        renderSlideshowConfig: {
            hooks: [
                "createTile",
                // "updateTile",
                "preUpdateTile",
                "deleteTile",
                "canvasReady",
                "createJournalEntry",
                "updateJournalEntry",
                "deleteJournalEntry",
                "updateJTCSSettings",
                // "updateArtGalleryTiles"
                "updateDefaultArtTile",
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
                    handlerFunction: async (options) => {
                        // let { currentScene } = options;
                        let currentScene = game.scenes.viewed;
                        await updateAllGalleryIndicators(currentScene);
                    },
                },
                {
                    hookName: "updateArtGalleryTiles",
                    handlerFunction: async (options) => {
                        // let { currentScene } = options;
                        let currentScene = game.scenes.viewed;
                        await updateAllGalleryIndicators(currentScene);
                    },
                },
                {
                    hookName: "updateDefaultArtTile",
                    handlerFunction: async (options) => {
                        let currentScene = game.scenes.viewed;
                        await updateAllGalleryIndicators(currentScene);
                    },
                },
            ],
        },
        addJTCSControls: {
            hooks: ["getSceneControlButtons"],
            handlerFunction: addJTCSControls,
        },
        updateUIColors: {
            hooks: ["updateJTCSSettings"],
            handlerFunction: async () => {
                await HelperFunctions.setUIColors();
            },
        },
        updateDefaultArtTile: {
            hooks: ["deleteTile"],
            handlerFunction: async (tileDoc) => {
                // let tiles = (await ArtTileManager.getSceneSlideshowTiles("art", true)).filter((item)=> !item.missing)
                // if(tiles){
                // }
                // await ArtTileManager.updateDefaultArtTile(tileDoc);
            },
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
                // Hooks.once(hookName, handler.handlerFunction);
            }
        }
    }
    return {
        registerHooks: registerHooks,
    };
};
