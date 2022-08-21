"use strict";
import { log, MODULE_ID } from "./debug-mode.js";
import { ArtTileManager } from "./classes/ArtTileManager.js";
import { ImageDisplayManager } from "./classes/ImageDisplayManager.js";
import { CanvasIndicators } from "./classes/CanvasIndicators.js";
import { registerSettings } from "./settings.js";
import { HelperFunctions } from "./classes/HelperFunctions.js";
import ImageVideoPopout from "./classes/MultiMediaPopout.js";
import { SlideshowConfig } from "./SlideshowConfig.js";
import { SheetImageControls } from "./SheetImageControls.js";
import { JTCSActions } from "./data/JTCS-Actions.js";
import { generateTemplates, createTemplatePathString, mapTemplates } from "./data/templates.js";
import { registerHelpers } from "./handlebars/register-helpers.js";

const renderSheetHooks = ["renderItemSheet", "renderActorSheet", "renderJournalSheet"];
const createTileHooks = ["createTile", "updateTile", "deleteTile"];
const indicatorSetupHooks = [...createTileHooks, "canvasReady"];

/**
 * This sets up most hooks we want to respond to in our code,
 * grouping hooks with identical
 * callbacks into arrays on an object
 * @returns object containing registerHooks function
 */
const setupHookHandlers = async () => {
    async function renderSlideshowConfig() {
        if (game.JTCSlideshowConfig && game.JTCSlideshowConfig.rendered) {
            game.JTCSlideshowConfig.render(false);
        }
    }
    async function renderImageControls(app, html) {
        if (!game.user.isGM) {
            return;
        }
        // console.error(app, html, args);
        await SheetImageControls.applyImageClasses(app, html);
    }

    async function updateGalleryTileIndicator(tileDoc) {
        let tileID = tileDoc.id;
        let sceneTiles = await ArtTileManager.getSceneSlideshowTiles("", true);
        let foundTileData = await ArtTileManager.getTileDataFromFlag(tileID, sceneTiles);
        await CanvasIndicators.setUpIndicators(foundTileData, tileDoc);
    }

    async function updateAllGalleryIndicators(scene) {
        let tiles = scene.tiles;
        let artTileDataArray = await ArtTileManager.getSceneSlideshowTiles("", true);
        tiles.forEach(async (tileDoc) => {
            let foundTileData = artTileDataArray.find((tileData) => tileData.id === tileDoc.id);
            await CanvasIndicators.setUpIndicators(foundTileData, tileDoc);
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
                new SlideshowConfig().render(true);
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
                        updateAllGalleryIndicators(scene);
                    },
                },
                {
                    hookName: "updateArtGalleryTiles",
                    handlerFunction: async (scene) => {
                        console.log("Scene is", scene);
                        scene = game.scenes.viewed;
                        updateAllGalleryIndicators(scene);
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

Hooks.on("init", async () => {
    console.log("Initializing Journal to Canvas Slideshow");

    //register settings
    registerSettings();
    registerHelpers();

    libWrapper.register(
        "journal-to-canvas-slideshow",
        "TextEditor._onDropEditorData",
        function (wrapped, ...args) {
            let event = args[0];
            let editor = args[1];
            var files = event.dataTransfer.files;
            let containsImage = false;
            for (let f of files) {
                let type = f["type"].split("/")[0];
                if (type === "image") {
                    containsImage = true;
                    insertImageIntoJournal(f, editor);
                }
            }
            if (!containsImage) {
                console.log("TextEditor._onDropEditorData called");
                return wrapped(...args);
            }
        },
        "MIXED"
    );

    // once settings are set up, create our API object

    //map of template names w/ short keys
    let templates = generateTemplates();
    let mappedTemplates = mapTemplates(templates);

    game.modules.get("journal-to-canvas-slideshow").api = {
        templates: mappedTemplates,
        imageUtils: {
            manager: ImageDisplayManager,
            displayImageInScene: ImageDisplayManager.displayImageInScene,
            updateTileObjectTexture: ImageDisplayManager.updateTileObjectTexture,
            scaleToScene: ImageDisplayManager.scaleArtTileToScene,
            scaleToBoundingTile: ImageDisplayManager.scaleArtTileToFrameTile,
        },
        tileUtils: {
            createAndLinkSceneTile: ArtTileManager.createAndLinkSceneTile,
            // createArtTileObject: ArtTileManager.createArtTileObject,
            // createFrameTileObject: ArtTileManager.createFrameTileObject,
            getSceneSlideshowTiles: ArtTileManager.getSceneSlideshowTiles,
            getDefaultData: ArtTileManager.getDefaultData,
            getFrameTiles: ArtTileManager.getFrameTiles,
            getDisplayTiles: ArtTileManager.getDisplayTiles,
            getTileObjectByID: ArtTileManager.getTileObjectByID,
            selectTile: ArtTileManager.selectTile,
            renderTileConfig: ArtTileManager.renderTileConfig,
            updateTileDataID: ArtTileManager.updateTileDataID,
            updateSceneTileFlags: ArtTileManager.updateSceneTileFlags,
            getTileDataFromFlag: ArtTileManager.getTileDataFromFlag,
            getUnlinkedTileIDs: ArtTileManager.getUnlinkedTileIDs,
            getMissingTiles: ArtTileManager.getMissingTiles,
            deleteSceneTileData: ArtTileManager.deleteSceneTileData,
            getAllScenesWithSlideshowData: ArtTileManager.getAllScenesWithSlideshowData,
        },
        indicatorUtils: {
            createTileIndicator: CanvasIndicators.createTileIndicator,
            deleteTileIndicator: CanvasIndicators.deleteTileIndicator,
            hideTileIndicator: CanvasIndicators.hideTileIndicator,
            showTileIndicator: CanvasIndicators.showTileIndicator,
            setUpIndicators: CanvasIndicators.setUpIndicators,
        },
        utils: {
            createDialog: HelperFunctions.createDialog,
            swapTools: HelperFunctions.swapTools,
            setSettingValue: HelperFunctions.setSettingValue,
            getSettingValue: HelperFunctions.getSettingValue,
            createTemplatePathString: createTemplatePathString,
            createEventActionObject: HelperFunctions.createEventActionObject,
        },
    };

    //load templates
    loadTemplates(templates);

    // now that we've created our API, inform other modules we are ready
    // provide a reference to the module api as the hook arguments for good measure
    Hooks.callAll("journalToCanvasSlideshowReady", game.modules.get("journal-to-canvas-slideshow").api);
});

Hooks.on("journalToCanvasSlideshowReady", async (api) => {
    game.JTCS = api;
    await (await setupHookHandlers()).registerHooks();
    // await setupHookHandlers.registerHooks();
    // setUpSheetRenderHooks();
    // setUpIndicatorHooks();
});

Hooks.once("renderSlideshowConfig", (app) => {
    game.JTCSlideshowConfig = app;
});

// Hooks.on("canvasReady", async (canvas) => {
//     const isDebugging = game.modules.get("_dev-mode")?.api?.getPackageDebugValue(MODULE_ID);
//     //re-render the tile config
//     if (game.JTCSlideshowConfig && game.user.isGM && isDebugging) {
//         game.JTCSlideshowConfig.render(true);
//     }
//     //get tile data from scene flags

//     let artTileDataArray = await ArtTileManager.getSceneSlideshowTiles("", true);

//     game.scenes.viewed.tiles.forEach(async (tileDoc) => {
//         let foundTileData = artTileDataArray.find((tileData) => tileData.id === tileDoc.id);

//         await CanvasIndicators.setUpIndicators(foundTileData, tileDoc);
//     });
// });

// Hooks.on("canvasReady", (canvas) => {
//     //! This should ONLY re-render if the editor is not actively being edited
//     let renderedJournalSheets = Object.values(window.ui.windows).filter(
//         (obj) => obj.document?.documentName === "JournalEntry" && obj.editors?.content.active === false //?editors.content.active === false ensures the editor is not being actively edited before re-rendering the entry
//     );
//     renderedJournalSheets.forEach((sheet) => {
//         let windowContent = sheet.element[0].querySelector(".window-content");
//         if (windowContent.classList.contains("fade")) {
//             windowContent.classList.remove("fade");
//         }
//         sheet.render(true);
//     });
// });

Hooks.on("getSceneControlButtons", (controls) => {
    //controls refers to all of the controls
});

async function insertImageIntoJournal(file, editor) {
    if (typeof ForgeVTT != "undefined" && ForgeVTT.usingTheForge) {
        source = "forgevtt";
    } else {
        var source = "data";
    }
    let response;
    if (file.isExternalUrl) {
        response = {
            path: file.url,
        };
    } else {
        response = await FilePicker.upload(
            source,
            "/upload",
            // game.settings.get("journal-to-canvas-slideshow", "imageSaveLocation"),
            file,
            {}
        );
    }
    let contentToInsert = `<p><img src="${response.path}" width="512" height="512" /></p>`;
    if (contentToInsert) editor.insertContent(contentToInsert);
}

Hooks.on("canvasReady", async (canvas) => {
    const isDebugging = game.modules.get("_dev-mode")?.api?.getPackageDebugValue(MODULE_ID);
    //re-render the tile config
    if (game.JTCSlideshowConfig && game.user.isGM && isDebugging) {
        game.JTCSlideshowConfig.render(true);
    }

    //get tile data from scene flags

    let artTileDataArray = await game.JTCS.tileUtils.getSceneSlideshowTiles("", true);

    game.scenes.viewed.tiles.forEach(async (tileDoc) => {
        let foundTileData = artTileDataArray.find((tileData) => tileData.id === tileDoc.id);

        await game.JTCS.indicatorUtils.setUpIndicators(foundTileData, tileDoc);
    });
});

Hooks.on("renderTileConfig", async (app, element) => {
    let currentScene = game.scenes.viewed;

    //get tiles with flags
    let flaggedTiles = await game.JTCS.tileUtils.getSceneSlideshowTiles();
    let defaultData = await game.JTCS.tileUtils.getDefaultData();

    //get data from tiles
    if (flaggedTiles) {
        defaultData = await game.JTCS.tileUtils.getTileDataFromFlag(app.object.data._id, flaggedTiles);
        defaultData = { ...defaultData };
        defaultData.boundingTiles = await game.JTCS.tileUtils.getFrameTiles(flaggedTiles);
    }

    if (element[0] && !element[0]?.querySelector("#displayTileData")) {
        //if we don't have this data
        // let template = "modules/journal-to-canvas-slideshow/templates/display-tile-config.hbs";
        let showConfigButton = document.createElement("button");
        showConfigButton.setAttribute("id", defaultData.id);

        const target = $(element).find(`[name="tint"]`).parent().parent();
        target.after(showConfigButton);
        $(showConfigButton).on("click", (event) => {
            let btn = event.currentTarget;
            if (game.JTCSlideshowConfig) {
                game.JTCSlideshowConfig.render(true);
            } else {
                game.JTCSlideshowConfig = new SlideshowConfig().render(true);
            }
            // if(game.JTCSlideshowConfig.rendered)
        });
        // let renderHtml = await renderTemplate(template, defaultData);
    }
});
