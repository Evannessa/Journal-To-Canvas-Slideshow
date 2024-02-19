"use strict";
import { ArtTileManager } from "./classes/ArtTileManager.js";
import { CanvasIndicators } from "./classes/CanvasIndicators.js";
import { HelperFunctions } from "./classes/HelperFunctions.js";
import { ImageDisplayManager } from "./classes/ImageDisplayManager.js";
import ImageVideoPopout from "./classes/MultiMediaPopout.js";
import { JTCSActions } from "./data/JTCS-Actions.js";
import { SheetImageApp } from "./SheetImageApp.js";
import { SheetImageDataController } from "./SheetImageDataController.js";
import { SlideshowConfig } from "./SlideshowConfig.js";

import { log, MODULE_ID } from "./debug-mode.js";
import {
    generateTemplates,
    createTemplatePathString,
    mapTemplates,
} from "./data/templates.js";
import { registerHelpers } from "./handlebars/register-helpers.js";
import { registerSettings } from "./settings.js";
import { setupHookHandlers } from "./hooks.js";
import { universalInterfaceActions as UIA } from "./data/Universal-Actions.js";
import { SheetConfigApp } from "./classes/SheetConfigApp.js";

export const JTCSModules = {
    ArtTileManager,
    CanvasIndicators,
    HelperFunctions,
    ImageDisplayManager,
    ImageVideoPopout,
    JTCSActions,
    SheetImageApp,
    SheetImageDataController,
    SlideshowConfig,
    SheetConfigApp
};

Hooks.once("ready", () => {
    try {
        window.Ardittristan.ColorSetting.tester;
    } catch {
        ui.notifications.notify(
            'Journal to Canvas Slideshow requires the "lib - ColorSettings" module. Please make sure you have it installed and enabled.',
            "error"
        );
    }
});



Hooks.on("init", async () => {

    console.log("Initializing Journal to Canvas Slideshow");

    //register settings
    registerSettings();
    //register handlebars helpers
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



    //map of template names w/ short keys
    let templates = generateTemplates();
    let mappedTemplates = mapTemplates(templates);

    // once settings are set up, create our API object
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
            manager: ArtTileManager,
            getLinkedFrameID: ArtTileManager.getLinkedFrameID,
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
            manager: HelperFunctions,
            createDialog: HelperFunctions.createDialog,
            swapTools: HelperFunctions.swapTools,
            setSettingValue: HelperFunctions.setSettingValue,
            getSettingValue: HelperFunctions.getSettingValue,
            createTemplatePathString: createTemplatePathString,
            createEventActionObject: HelperFunctions.createEventActionObject,
        },
        sheetImageUtils: {
            manager: SheetImageApp,
        },
    };

    //load templates
    loadTemplates(templates);
    // now that we've created our API, inform other modules we are ready
    // provide a reference to the module api as the hook arguments for good measure
    Hooks.callAll(
        "journalToCanvasSlideshowReady",
        game.modules.get("journal-to-canvas-slideshow").api
    );
});

Hooks.on("journalToCanvasSlideshowReady", async (api) => {
    game.JTCS = api;
    await (await setupHookHandlers()).registerHooks();
    await HelperFunctions.setUIColors();
    // await setupHookHandlers.registerHooks();
    // setUpSheetRenderHooks();
    // setUpIndicatorHooks();
});

Hooks.once("renderSlideshowConfig", (app) => {
    game.JTCSlideshowConfig = app;
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

Hooks.once("canvasReady", async () => {
    const showWelcomeMessage = await HelperFunctions.getSettingValue(
        "showWelcomeMessage"
    );
    if (showWelcomeMessage && game.user.isGM) {
        await HelperFunctions.showWelcomeMessage();
    }
});

Hooks.on("canvasReady", async (canvas) => {
    //get tile data from scene flags

    let artTileDataArray = (await ArtTileManager.getSceneSlideshowTiles("", true)).filter(
        (item) => !item.missing
    );

    game.scenes.viewed.tiles.forEach(async (tileDoc) => {
        let foundTileData = artTileDataArray.find(
            (tileData) => tileData.id === tileDoc.id
        );

        await CanvasIndicators.setUpIndicators(foundTileData, tileDoc);
    });
});

/**
 * For rendering a button in the Tile Config that shows the linked Art Tile
 */
Hooks.on("renderTileConfig", async (app, element) => {
    let currentScene = game.scenes.viewed;

    //get tiles with flags
    let flaggedTiles = await ArtTileManager.getSceneSlideshowTiles();
    let defaultData = await ArtTileManager.getDefaultData();

    //get data from tiles
    if (flaggedTiles) {
        let tileID = game.version >= 10 ? app.object._id : app.object.data._id;
        defaultData = await ArtTileManager.getTileDataFromFlag(tileID, flaggedTiles);
        defaultData = { ...defaultData };
        defaultData.boundingTiles = await game.JTCS.tileUtils.getFrameTiles(flaggedTiles);
    }

    if (element[0] && !element[0]?.querySelector("#displayTileData")) {
        //if we don't have this data
        // let template = "modules/journal-to-canvas-slideshow/templates/display-tile-config.hbs";
        const showConfigButton = document.createElement("button");
        showConfigButton.textContent = "Open Gallery Config";
        showConfigButton.setAttribute("id", defaultData.id);
        showConfigButton.setAttribute("type", "button");

        const target = $(element).find(`[name="tint"]`).parent().parent();
        target.after(showConfigButton);
        $(showConfigButton).on("click", async (event) => {
            event.preventDefault();
            await UIA.renderAnotherApp("JTCSlideshowConfig", SlideshowConfig);
            // let btn = event.currentTarget;
            // if (game.JTCSlideshowConfig) {
            //     game.JTCSlideshowConfig.render(true);
            // } else {
            //     game.JTCSlideshowConfig = new SlideshowConfig().render(true);
            // }
        });
    }
});
