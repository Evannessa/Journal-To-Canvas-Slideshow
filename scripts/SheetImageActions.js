"use strict";
import { SheetImageControls } from "./SheetImageControls.js";
export const sheetImageActions = {
    image: {
        click: {
            sendImageDataToDisplay: {
                onClick: async (event, options) => {
                    event.stopPropagation();
                    event.stopImmediatePropagation();
                    let { app, html, imgElement } = options;

                    // bundle all the necessary data into an object
                    let sheetImageData = await SheetImageControls.wrapSheetImageData(options);

                    await game.JTCS.imageUtils.manager.determineDisplayMethod(sheetImageData);
                },
            },
        },
        hover: {
            showTileIndicator: {
                onHover: async (event, options) => {
                    // event.stopPropagation();
                    // event.stopImmediatePropagation();
                    let { app, html, imgElement } = options;
                    console.log("our data on hover is", options);
                    let imageData = await SheetImageControls.getJournalImageFlagData(journalSheet.object, imgElement);

                    // do not continue this if we find no image data
                    if (!imageData) {
                        log(false, "No image data found; Returning!");
                        return;
                    }
                    //we need to get the data for the tile
                    let isLeave = event.type === "mouseleave" || event.type === "mouseout" ? true : false;
                    let sceneID = game.scenes.viewed.id;

                    let tileID = imageData.scenesData.find(
                        (sceneData) => sceneData.sceneID === sceneID
                    )?.selectedTileID;
                    if (!tileID) {
                        log(false, ["No tile with this id ", tileID, "found in scene", sceneID]);
                        return;
                    }
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
                    let tileID = event.currentTarget.previousElementSibling.value; //this should grab the value from the radio button itself
                    let tile = await game.JTCS.tileUtils.getTileObjectByID(tileID);

                    if (isLeave) {
                        await game.JTCS.indicatorUtils.hideTileIndicator(tile);
                    } else {
                        await game.JTCS.indicatorUtils.showTileIndicator(tile);
                    }
                },
            },
        },
        change: {
            updateImageFlags: {
                onChange: async (event, data) => {
                    let { journalSheet, imgElement } = data;
                    event.stopPropagation();
                    event.stopImmediatePropagation();
                    let value = event.currentTarget.value;
                    let updateData = {
                        name: imgElement.dataset.name,
                        scenesData: [
                            {
                                sceneID: game.scenes.viewed.data._id,
                                selectedTileID: value,
                            },
                        ],
                    };
                    await SheetImageControls.assignImageFlags(journalSheet, imgElement, updateData);
                },
            },
        },
    },
    displayActionButton: {
        click: {
            fadeJournal: {
                onClick: async (event, data) => {
                    let { journalSheet, imgElement } = data;
                    event.stopPropagation();
                    event.stopImmediatePropagation();

                    //get the action
                    let action = event.currentTarget.dataset.action;

                    if (action === "fadeJournal" || action === "fadeContent") {
                        await SheetImageControls.addFadeStylesToSheet(event);
                    }
                },
            },
            sendImageDataToDisplay: {
                onClick: async (event, data) => {
                    let { journalSheet, imgElement } = data;
                    event.stopPropagation();
                    event.stopImmediatePropagation();

                    //get the action
                    let method = event.currentTarget.dataset.action;
                    //otherwise, just launch to the clicked button's display location
                    let sheetImageData = await SheetImageControls.wrapSheetImageData({ ...data, method: method });
                    await game.JTCS.imageUtils.manager.determineDisplayMethod(sheetImageData);
                },
            },
        },
        ctrlClick: {
            //for ctrl + click
            storeDefaultAction: {
                onClick: async (event, data) => {
                    let { method } = data;
                    //if control is pressed down, change the displayLocation to automatically be set to this when you click on the image
                    //if the control key was also pressed, store the display location
                    await SheetImageControls.assignImageFlags(journalSheet, imgElement, {
                        method: method,
                    });
                },
            },
        },
    },
};
