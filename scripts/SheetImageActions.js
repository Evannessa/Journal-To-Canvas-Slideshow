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
        tooltip: "open Gallery Tile Config Application for the current scene",
        icon: "fas fa-cubes",
    },
    {
        action: "sheet.click.openSettingsApp",
        tooltip: "open JTCS Art Gallery Settings",
        icon: "fas fa-cog",
    },

    // {
    //     action: "sheet.click.toggleInstructions",
    //     tooltip: "show or hide contextual instructions",
    //     icon: "fas fa-info",
    // },
    // {
    //     action: "sheet.click.showURLShareDialog",
    //     tooltip: "Share a URL Image with your players",
    //     icon: "fas fa-external-link",
    // },
];
export const dedicatedDisplayControls = [
    {
        label: "view",
        callback: (controls) => {},
    },
    {
        label: "showToAll",
        callback: () => {},
    },
    {
        label: "showToSome",
        callback: () => {},
    },
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
                    let currentSetting = await HelperFunctions.getFlagValue(
                        journalEntry,
                        "showControls",
                        "",
                        false
                    );
                    //if current setting is false, or doesn't exist, set it to true
                    if (!currentSetting || currentSetting.length === 0) {
                        await HelperFunctions.setFlagValue(
                            journalEntry,
                            "showControls",
                            true
                        );
                    } else {
                        await HelperFunctions.setFlagValue(
                            journalEntry,
                            "showControls",
                            false
                        );
                    }

                    UIA.toggleHideAllSiblings(event);
                    UIA.toggleActiveStyles(event);
                },
            },
            changeControlsPosition: {
                onClick: async (event, options) => {
                    let positions = [
                        "top-left",
                        "top-right",
                        "bottom-left",
                        "bottom-right",
                    ];
                    await HelperFunctions.getFlagValue(journalEntry, "controlsPosition");
                    await HelperFunctions.setFlagValue(
                        journalEntry,
                        "controlsPosition",
                        true
                    );
                },
            },
            openSlideshowConfig: {
                onClick: async () => {
                    await UIA.renderAnotherApp("JTCSlideshowConfig", SlideshowConfig);
                },
            },
            openSettingsApp: {
                onClick: async () => {
                    await UIA.renderAnotherApp(
                        "JTCSSettingsApp",
                        JTCSSettingsApplication
                    );
                },
            },
            showURLShareDialog: {
                onClick: async (event, options) =>
                    await extraActions.showURLShareDialog(event, options),
            },
            toggleInstructions: {
                onClick: (event, option) => {
                    const parentElement = event.currentTarget.closest("editor");
                    UIA.toggleShowAnotherElement(event, {
                        parentItem: parentElement,
                        targetClassSelector: "instructions",
                    });
                },
            },
        },
    },
    image: {
        click: {
            sendImageDataToDisplay: {
                onClick: async (event, options) => {
                    // event.stopPropagation();
                    options.method = "anyScene";
                    // event.stopImmediatePropagation();

                    // bundle all the necessary data into an object
                    let sheetImageData =
                        await SheetImageDataController.wrapSheetImageData(options);

                    await ImageDisplayManager.determineDisplayMethod(sheetImageData);
                },
            },
        },
        hover: {
            showTileIndicator: {
                onHover: async (event, options) => {
                    //!get the default tile
                    //get the default art tile in this scene
                    let tileID = await ArtTileManager.getDefaultArtTileID(
                        game.scenes.viewed
                    );
                    let isLeave =
                        event.type === "mouseleave" || event.type === "mouseout"
                            ? true
                            : false;
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
                    let isLeave =
                        event.type === "mouseout" || event.type === "mouseleave";
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
                    let tileID = event.currentTarget.dataset.id;
                    if (event.ctrlKey) {
                        const appName = "JTCSlideshowConfig";
                        await UIA.renderAnotherApp(appName, SlideshowConfig);
                        if (game[appName]) {
                            const configElement = game[appName].element;
                            configElement.focus();

                            const tileItem = configElement.find(`[data-id='${tileID}']`);
                            if (tileItem && tileItem[0]) {
                                tileItem[0].scrollIntoView();
                                tileItem[0].focus();
                            }
                        }
                        return;
                    }

                    let url = ImageDisplayManager.getImageSource(imgElement);
                    const frameID = await ArtTileManager.getGalleryTileDataFromID(
                        tileID,
                        "linkedBoundingTile"
                    );
                    await ImageDisplayManager.updateTileObjectTexture(
                        tileID,
                        frameID,
                        url,
                        "anyScene"
                    );

                    //once clicked, hide the buttons
                    UIA.toggleHideAncestor(event, {
                        ...options,
                        ancestorSelector: "#displayTileButtons",
                    });
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
                    let sheetImageData =
                        await SheetImageDataController.wrapSheetImageData({
                            ...options,
                            method: method,
                            imgElement,
                        });

                    await ImageDisplayManager.determineDisplayMethod(sheetImageData);

                    //TODO: add this functionality in later for prompting the user for what to do next
                    // if (method === "journalEntry" || method === "artScene") {
                    //     let property = method === "journalEntry" ? "journal" : "scene";
                    //     const autoActivate = await HelperFunctions.getSettingValue(
                    //         "artGallerySettings",
                    //         `dedicatedDisplayData.${property}.autoActivate`
                    //     );
                    //     if (!autoActivate) {
                    //         UIA.toggleShowAnotherElement(event, options);
                    //         UIA.toggleActiveStyles(event);
                    //     }
                    // }
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
