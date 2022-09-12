"use strict";
import { HelperFunctions } from "./classes/HelperFunctions.js";
import { SheetImageDataController } from "./SheetImageDataController.js";
import { SheetImageApp } from "./SheetImageApp.js";
import { SlideshowConfig } from "./SlideshowConfig.js";
import { JTCSSettingsApplication } from "./classes/JTCSSettingsApplication.js";
import { universalInterfaceActions as UIA } from "./data/Universal-Actions.js";

export const sheetControls = [
    {
        action: "sheet.click.fadeJournal",
        icon: "fas fa-eye-slash",
        tooltip: "Fade sheet background to see canvas",
    },
    {
        action: "sheet.click.toggleImageControls",
        tooltip: "Toggle the image controls on this sheet",
        icon: "fas fa-sliders-h",
    },
    {
        action: "sheet.click.openSlideshowConfig",
        tooltip: "open Art Gallery Tile Configuration for the current scene",
        icon: "fas fa-cubes",
    },
    {
        action: "sheet.click.openSettingsApp",
        tooltip: "open Journal to Canvas Slideshow Settings",
        icon: "fas fa-cog",
    },
];
export const sheetImageActions = {
    sheet: {
        click: {
            fadeJournal: {
                onClick: async (event, options) => {
                    await SheetImageApp.addFadeStylesToSheet(event);
                },
            },
            setDefaultTileInScene: {
                onClick: async (event, options) => {
                    //TODO:
                    //? show the tiles
                },
            },
            toggleImageControls: {
                onClick: async (event, options) => {
                    let { app } = options;
                    let journalEntry = app.object;
                    let currentSetting = HelperFunctions.getFlagValue(journalEntry, "showControls");
                    //if current setting is false, or doesn't exist, set it to true
                    if (!currentSetting) {
                        await HelperFunctions.setFlagValue(journalEntry, "showControls", true);
                    } else {
                        await HelperFunctions.setFlagValue(journalEntry, "showControls", false);
                    }
                },
            },
            openSlideshowConfig: {
                onClick: async () => {
                    UIA.renderAnotherApp("JTCSlideshowConfig", SlideshowConfig);
                },
            },
            openSettingsApp: {
                onClick: async () => {
                    UIA.renderAnotherApp("JTCSSettingsApp", JTCSSettingsApplication);
                },
            },
        },
    },
    image: {
        click: {
            sendImageDataToDisplay: {
                onClick: async (event, options) => {
                    // event.stopPropagation();
                    // event.stopImmediatePropagation();

                    // bundle all the necessary data into an object
                    let sheetImageData = await SheetImageDataController.wrapSheetImageData(options);

                    await game.JTCS.imageUtils.manager.determineDisplayMethod(sheetImageData);
                },
            },
        },
        hover: {
            showTileIndicator: {
                onHover: async (event, options) => {
                    //!get the default tile
                    //get the default art tile in this scene
                    let tileID = await game.JTCS.tileUtils.manager.getDefaultArtTileID();
                    let isLeave = event.type === "mouseleave" || event.type === "mouseout" ? true : false;
                    let tile = await game.JTCS.tileUtils.getTileObjectByID(tileID);
                    if (isLeave) {
                        await game.JTCS.indicatorUtils.hideTileIndicator(tile);
                    } else {
                        await game.JTCS.indicatorUtils.showTileIndicator(tile);
                    }
                },
            },
        },
    },
    tileButton: {
        hover: {
            showTileIndicator: {
                onHover: async (event, data = {}) => {
                    let isLeave = event.type === "mouseout" || event.type === "mouseleave";
                    let tileID = event.currentTarget.dataset.id; //this should grab the value from the radio button itself
                    let tile = await game.JTCS.tileUtils.getTileObjectByID(tileID);

                    if (isLeave) {
                        await game.JTCS.indicatorUtils.hideTileIndicator(tile);
                    } else {
                        await game.JTCS.indicatorUtils.showTileIndicator(tile);
                    }
                },
            },
        },
        click: {
            displayImageOnTile: {
                onClick: async (event, options) => {
                    let { imgElement } = options;

                    let url = game.JTCS.imageUtils.manager.getImageSource(imgElement);
                    let tileID = event.currentTarget.dataset.id;
                    let frameID = await game.JTCS.tileUtils.getLinkedFrameID(tileID);

                    await game.JTCS.imageUtils.manager.updateTileObjectTexture(tileID, frameID, url);

                    //once clicked, hide the buttons
                    UIA.toggleHideAncestor(event, { ...options, ancestorSelector: "#displayTileButtons" });
                },
            },
        },
    },
    displayActionButton: {
        click: {
            sendImageDataToDisplay: {
                onClick: async (event, options) => {
                    let { app, html, imgElement } = options;
                    let method = event.currentTarget.dataset.method;
                    let sheetImageData = await SheetImageDataController.wrapSheetImageData({
                        ...options,
                        method: method,
                        imgElement,
                    });
                    await game.JTCS.imageUtils.manager.determineDisplayMethod(sheetImageData);
                },
            },
            revealTileButtons: {
                onClick: async (event, options) => {
                    UIA.toggleShowAnotherElement(event, options);
                    UIA.toggleActiveStyles(event);
                },
            },
        },
    },
};
