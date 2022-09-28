"use strict";

import { HelperFunctions } from "./classes/HelperFunctions.js";
import { SheetImageDataController } from "./SheetImageDataController.js";
import { SheetImageApp } from "./SheetImageApp.js";
import { SlideshowConfig } from "./SlideshowConfig.js";
import { extraActions } from "./data/SlideshowConfigActions.js";
import { ArtTileManager } from "./classes/ArtTileManager.js";
import { ImageDisplayManager } from "./classes/ImageDisplayManager.js";
import { JTCSSettingsApplication } from "./classes/JTCSSettingsApplication.js";
import { universalInterfaceActions as UIA } from "./data/Universal-Actions.js";

export const sheetControls = [
    {
        action: "sheet.click.toggleImageControls",
        tooltip: "Toggle the image controls on this sheet",
        icon: "fas fa-sliders-h",
        toggle: true,
        activeOn: "showControls",
    },
    {
        action: "sheet.click.fadeJournal",
        icon: "fas fa-eye-slash",
        tooltip: "Fade sheet background to see canvas",
        // toggle: true,
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
    // {
    //     action: "sheet.click.showURLShareDialog",
    //     tooltip: "Share a URL Image with your players",
    //     icon: "fas fa-external-link",
    // },
];
export const sheetImageActions = {
    sheet: {
        click: {
            fadeJournal: {
                onClick: async (event, options) => {
                    await SheetImageApp.addFadeStylesToSheet(event);
                    UIA.toggleActiveStyles(event);
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
                    let currentSetting = await HelperFunctions.getFlagValue(journalEntry, "showControls", "", false);
                    //if current setting is false, or doesn't exist, set it to true
                    if (!currentSetting || currentSetting.length === 0) {
                        await HelperFunctions.setFlagValue(journalEntry, "showControls", true);
                    } else {
                        await HelperFunctions.setFlagValue(journalEntry, "showControls", false);
                    }

                    UIA.toggleHideAllSiblings(event);
                    UIA.toggleActiveStyles(event);
                },
            },
            changeControlsPosition: {
                onClick: async (event, options) => {
                    let positions = ["top-left", "top-right", "bottom-left", "bottom-right"];
                    await HelperFunctions.getFlagValue(journalEntry, "controlsPosition");
                    await HelperFunctions.setFlagValue(journalEntry, "controlsPosition", true);
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
            showURLShareDialog: {
                onClick: async (event, options) => await extraActions.showURLShareDialog(event, options),
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
                    let tileID = await ArtTileManager.getDefaultArtTileID(game.scenes.viewed);
                    let isLeave = event.type === "mouseleave" || event.type === "mouseout" ? true : false;
                    let tile = await ArtTileManager.getTileObjectByID(tileID);
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
