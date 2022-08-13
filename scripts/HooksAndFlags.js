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

const baseTemplatePath = `modules/${MODULE_ID}/templates/`;

const renderSheetHooks = ["renderItemSheet", "renderActorSheet", "renderJournalSheet"];

const templateBaseNames = [
    `tile-list-item.hbs`,
    "tooltip.hbs",
    "control-button.hbs",
    `new-tile-list-item.hbs`,
    `icon-button.hbs`,
    `display-tile-config.hbs`,
    `image-controls.hbs`,
];

Hooks.on("init", async () => {
    console.log("Initializing Journal to Canvas Slideshow");

    //register settings
    registerSettings();
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
    game.modules.get("journal-to-canvas-slideshow").api = {
        imageUtils: {
            manager: ImageDisplayManager,
            displayImageInScene: ImageDisplayManager.displayImageInScene,
            updateTileInScene: ImageDisplayManager.updateTileObjectTexture,
            scaleToScene: ImageDisplayManager.scaleArtTileToScene,
            scaleToBoundingTile: ImageDisplayManager.scaleArtTileToFrameTile,
        },
        tileUtils: {
            createDisplayTile: ArtTileManager.createArtTile,
            createFrameTile: ArtTileManager.createFrameTile,
            getSceneSlideshowTiles: ArtTileManager.getSceneSlideshowTiles,
            getDefaultData: ArtTileManager.getDefaultData,
            getFrameTiles: ArtTileManager.getFrameTiles,
            getDisplayTiles: ArtTileManager.getDisplayTiles,
            getTileByID: ArtTileManager.getTileByID,
            selectTile: ArtTileManager.selectTile,
            renderTileConfig: ArtTileManager.renderTileConfig,
            updateTileDataID: ArtTileManager.updateTileDataID,
            updateSceneTileFlags: ArtTileManager.updateSceneTileFlags,
            getTileDataFromFlag: ArtTileManager.getTileDataFromFlag,
            getUnlinkedTileIDs: ArtTileManager.getUnlinkedTileIDs,
            getMissingTiles: ArtTileManager.getMissingTiles,
            deleteSceneTileData: ArtTileManager.deleteSceneTileData,
        },
        indicatorUtils: {
            createTileIndicator: CanvasIndicators.createTileIndicator,
            deleteTileIndicator: CanvasIndicators.deleteTileIndicator,
            hideTileIndicator: CanvasIndicators.hideTileIndicator,
            showTileIndicator: CanvasIndicators.showTileIndicator,
            setUpIndicators: CanvasIndicators.setUpIndicators,
            updateSceneIndicatorColors: CanvasIndicators.updateSceneColors,
            updateUserIndicatorColors: CanvasIndicators.updateUserColors,
        },
        utils: {
            swapTools: HelperFunctions.swapTools,
            setSettingValue: HelperFunctions.setSettingValue,
            getSettingValue: HelperFunctions.getSettingValue,
        },
    };

    //load templates
    let templates = generateTemplates(templateBaseNames);
    loadTemplates(templates);

    // now that we've created our API, inform other modules we are ready
    // provide a reference to the module api as the hook arguments for good measure
    Hooks.callAll("journalToCanvasSlideshowReady", game.modules.get("journal-to-canvas-slideshow").api);
});

Hooks.on("journalToCanvasSlideshowReady", async (api) => {
    game.JTCS = api;
    setUpSheetRenderHooks();
});

Hooks.once("renderSlideshowConfig", (app) => {
    game.JTCSlideshowConfig = app;
});

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

Hooks.on("canvasReady", (canvas) => {
    //! This should ONLY re-render if the editor is not actively being edited
    let renderedJournalSheets = Object.values(window.ui.windows).filter(
        (obj) => obj.document?.documentName === "JournalEntry" && obj.editors?.content.active === false //?editors.content.active === false ensures the editor is not being actively edited before re-rendering the entry
    );
    renderedJournalSheets.forEach((sheet) => {
        let windowContent = sheet.element[0].querySelector(".window-content");
        if (windowContent.classList.contains("fade")) {
            windowContent.classList.remove("fade");
        }
        sheet.render(true);
    });
});

/**
 * Set up hooks for when sheets with images render,
 * like item, actor, and journal sheets
 */
function setUpSheetRenderHooks() {
    renderSheetHooks.forEach((hookName) => {
        Hooks.on(hookName, async (app, html) => {
            if (!game.user.isGM) {
                return;
            }
            await SheetImageControls.applyImageClasses(app, html);
        });
    });
}

// // Sheet rendering
// Hooks.on("renderItemSheet", (app, html, options) => {
//     //here we need to find the image
//     applyImageClasses(app, html);
// });

// Hooks.on("renderJournalSheet", (app, html, options) => {
//     if (!game.user.isGM) {
//         //if the user isn't the GM, return
//         return;
//     }
//     applyClasses(app, html); //add classes to all the images in the sheet

//     setEventListeners(html, app); //add all the event listeners to the images in the sheet

//     if (findDisplayJournal() && app.object == displayJournal) {
//         //find the display journal
//         //the image that will be changed
//     }
// });

// Hooks.on("renderActorSheet", (app, html, options) => {
//     //here we need to find the image
//     applyClasses(app, html);
// });

//tile creation
Hooks.on("createTile", async (tileDoc) => {
    let tileID = tileDoc.id;
    let sceneTiles = await game.JTCS.tileUtils.getSceneSlideshowTiles("", true);
    let foundTileData = await game.JTCS.tileUtils.getTileDataFromFlag(tileID, sceneTiles);
    await game.JTCS.indicatorUtils.setUpIndicators(foundTileData, tileDoc);
});

Hooks.on("getSceneControlButtons", (controls) => {
    //controls refers to all of the controls
    const tileControls = controls.find((control) => control?.name === "tiles");

    if (game.user.isGM) {
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

Hooks.on("createTile", () => {
    if (game.JTCSlideshowConfig && game.JTCSlideshowConfig.rendered) {
        console.log("Shoud re-render");
        game.JTCSlideshowConfig.render(false);
    }
});

Hooks.on("deleteTile", () => {
    if (game.JTCSlideshowConfig && game.JTCSlideshowConfig.rendered) {
        game.JTCSlideshowConfig.render(true);
    }
});
Hooks.on("updateTile", () => {
    if (game.JTCSlideshowConfig && game.JTCSlideshowConfig.rendered) {
        game.JTCSlideshowConfig.render(false);
    }
});

Hooks.on("renderTileConfig", async (app, element) => {
    let currentScene = game.scenes.viewed;

    //get tiles with flags
    let flaggedTiles = await game.JTCS.tileUtils.getSceneSlideshowTiles();
    let defaultData = await game.JTCS.tileUtils.getDefaultData();

    // let defaultData = { displayName: "", isBoundingTile: false, linkedBoundingTile: "" };

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
        showConfigButton.on("click", (event) => {
            let btn = event.currentTarget;
            game.JTCSlideshowConfig.render(true);
            // if(game.JTCSlideshowConfig.rendered)
        });
        const target = $(element).find(`[name="tint"]`).parent().parent();
        target.after(showConfigButton);
        // let renderHtml = await renderTemplate(template, defaultData);
    }
});

/**
 * filter out the tile to be deleted
 */
Hooks.on("preDeleteTile", async (app, element) => {
    let tileID = app.object.data._id;
    await game.JTCS.tileUtils.deleteSceneTileData(tileID);
});
/**
 * TODO: Maybe place this in the helper functions?
 * @param {*} templateBaseNameArray
 * @returns
 */
function generateTemplates(templateBaseNameArray) {
    let templates = templateBaseNameArray.map((baseName) => `${baseTemplatePath}${baseName}`);
    return templates;
}
