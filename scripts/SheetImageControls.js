"use strict";
import { log } from "./debug-mode.js";
import { HelperFunctions } from "./classes/HelperFunctions.js";
import { sheetImageActions } from "./SheetImageActions.js";
export class SheetImageControls {
    static displayMethods = [
        {
            name: "window",
            icon: "fas fa-external-link-alt",
            tooltip: "display image in pop-out window",
        },
        {
            name: "journalEntry",
            icon: "fas fa-book-open",
            tooltip: "display image in a dedicated journal entry",
        },
        {
            name: "artScene",
            icon: "far fa-image",
            tooltip: "display image in dedicated scene",
        },
        {
            name: "anyScene",
            icon: "fas fa-vector-square",
            tooltip: "display image in any scene with a frame tile and display tile",
        },

        {
            name: "fadeJournal",
            icon: "fas fa-eye-slash",
            tooltip: "Fade journal background to see canvas",
            additionalClass: "toggle push-down",
            // additionalParentClass: "hover-reveal-right",
            // multi: true,
            // childButtons: [
            //     {
            //         name: "fadeContent",
            //         icon: "far fa-print-slash",
            //         tooltip: "Fade journal AND all its content",
            //         additionalClass: "toggle",
            //     },
            // ],
        },
    ];

    /**
     *
     * @param {Object} journalEntry - set a dedicated journal entry
     */

    static async applyImageClasses(app, html) {
        if (game.user.isGM) {
            let whichSheets = game.JTCS.utils.getSettingValue("artGallerySettings", "sheetSettings.choices");
            let canUseItemAndActorImages = game.JTCS.utils.getSettingValue("useActorSheetImages");
            // check to see if we should can use images in item and actor sheets too, or just in journal images
            let selectorString = canUseItemAndActorImages
                ? "img, video, .lightbox-image"
                : "img:not([data-edit]), video:not([data-edit]), .lightbox-image";

            html.find(selectorString).addClass("clickableImage");

            //inject the controls into every image that has the clickableImage or rightClickableImage classes
            Array.from(html[0].querySelectorAll(".clickableImage, .rightClickableImage")).forEach((img) =>
                SheetImageControls.injectImageControls(img, app)
            );
        }
    }

    /**
     * Implement this factory function to clean things up
     * @param {*} imageElement
     * @param {*} sceneID
     * @param {*} selectedTileID
     * @param {*} displayLocation
     * @returns
     */
    static async createJournalImageData(imageElement, sceneID, selectedTileID, displayLocation) {
        return {
            name: convertImageSourceToID(imageElement),
        };
    }

    /**
     * Store image data in flags
     * @param {App} journalSheet - the journal sheet whose images we're storing in the flag
     * @param {HTMLElement} imgElement - the image HTML element
     * @param {Obj} newImgData - the data being stored
     */
    static async assignImageFlags(journalSheet, imgElement, newImgData) {
        let journalEntry = journalSheet.object;
        let imageName = await SheetImageControls.convertImageSourceToID(imgElement);
        let clickableImages = await HelperFunctions.getFlag(journalEntry, "clickableImages");
        // let clickableImages = (await journalEntry.getFlag("journal-to-canvas-slideshow", "clickableImages")) || [];

        if (clickableImages.find((imgData) => imgData.name === imageName)) {
            clickableImages = clickableImages.map((imgData) => {
                // if the ids match, update the matching one with the new displayName
                return imgData.name === imageName ? { ...imgData, ...newImgData } : imgData; //else just return the original
            });
        } else {
            clickableImages.push({ name: imageName, ...newImgData });
        }

        await HelperFunctions.setFlag(journalEntry, "clickableImages", clickableImages);

        // await journalEntry.setFlag("journal-to-canvas-slideshow", "clickableImages", clickableImages);
    }

    static async setJournalFadeOpacity(journalSheet) {
        let opacityValue = game.JTCS.utils.getSettingValue("journalFadeOpacity");
        journalSheet.element[0].style.setProperty("--journal-fade", opacityValue + "%");
    }

    /**
     *  When the journal sheet renders, we're going to add controls over each image
     * @param {HTMLElement} imgElement - the image HTML element
     * @param {*} journalSheet - the journal sheet we're searching within
     */
    static async injectImageControls(imgElement, journalSheet) {
        await SheetImageControls.setJournalFadeOpacity(journalSheet);

        let template = "modules/journal-to-canvas-slideshow/templates/image-controls.hbs";

        let imageName = await SheetImageControls.convertImageSourceToID(imgElement);
        imgElement.dataset.name = imageName;

        //get the flags for this particular journal entry
        let imageFlagData = await SheetImageControls.getJournalImageFlagData(journalSheet.object, imgElement);

        log(false, ["Our image data is", imageFlagData]);

        if (imageFlagData) {
            imageFlagData = imageFlagData.scenesData?.find((obj) => obj.sceneID === game.scenes.viewed.data._id); //want to get the specific data for the current scene
        }

        let displayTiles = await game.JTCS.tileUtils.getSceneSlideshowTiles("art", true);
        displayTiles = displayTiles.map((tile) => {
            return {
                tile: tile,
                randomID: foundry.utils.randomID(),
            };
        });

        let users = game.users.contents;

        let renderHtml = await renderTemplate(template, {
            currentSceneName: game.scenes.viewed.name,
            displayMethods: SheetImageControls.displayMethods,
            displayTiles: displayTiles,
            imgPath: imageName,
            users: users,
            ...imageFlagData,
        });
        $(imgElement).attr("data-hover-action", "image.hover.showTileIndicator");
        $(imgElement).attr("data-action", "image.click.sendImageDataToDisplay");
        // $(imgElement).data({
        //     hoverAction: "image.hover.showTileIndicators",
        //     action: "image.click.sendImageDataToDisplay",
        // });

        //wrap each image in a clickableImageContainer
        $(imgElement).wrap("<div class='clickableImageContainer'></div>");

        $(imgElement).parent().append(renderHtml);
        await SheetImageControls.activateEventListeners({ journalSheet: journalSheet, imgElement: imgElement });
    }
    static async handleAction(event, journalSheet, actionType = "action") {
        event.preventDefault();
        let targetElement = $(event.currentTarget);
        let imgElement;
        //if our target element is not an image, get the closest image from our clickableImageContainer parent
        //else just get the current target itself
        if (targetElement.prop("nodeName") !== "IMG") {
            imgElement = targetElement[0].closest(".clickableImageContainer").querySelector("img");
        } else {
            imgElement = targetElement[0];
        }
        //if our target element is a label, get the input before it instead
        targetElement.prop("nodeName") === "LABEL" && (targetElement = targetElement.prev());

        let action = targetElement.data()[actionType];
        let handlerPropertyString = "onClick";

        switch (actionType) {
            case "hoverAction":
                handlerPropertyString = "onHover";
                break;
            case "changeAction":
                handlerPropertyString = "onChange";
                break;
        }
        let actionData = getProperty(sheetImageActions, action);

        if (actionData && actionData.hasOwnProperty(handlerPropertyString)) {
            //call the event handler stored on this object
            let options = {
                action: action,
                app: journalSheet,
                html: journalSheet.element,
                imgElement: imgElement,
            };
            actionData[handlerPropertyString](event, options);
        }
    }

    /**
     *
     * @param data - the data object
     */
    static async activateEventListeners(data) {
        let { journalSheet, imgElement } = data;
        let html = journalSheet.element;
        $(html)
            .off("click", "[data-action]")
            .on(
                "click",
                "[data-action]",
                async (event) => await SheetImageControls.handleAction(event, journalSheet, "action")
            );
        $(html)
            .off("mouseenter mouseleave", "[data-hover-action]")
            .on(
                "mouseenter mouseleave",
                "[data-hover-action]",
                async (event) => await SheetImageControls.handleAction(event, journalSheet, "hoverAction")
            );
        $(html)
            .off("change", "[data-change-action]")
            .on(
                "change",
                "[data-change-action]",
                async (event) => await SheetImageControls.handleAction(event, journalSheet, "changeAction")
            );

        // let locationButtons = imgElement
        //     .closest(".editor-content")
        //     .querySelectorAll(`.clickableImageContainer .displayLocations button`);

        // let tileRadioButtons = imgElement
        //     .closest(".editor-content")
        //     .querySelectorAll(`.clickableImageContainer .displayTiles input[type="radio"]`);

        // imgElement.addEventListener("click", async (event) => await SheetImageControls.onImageClick(event, data));
        // $(imgElement).on("mouseenter mouseleave", async (event) => await SheetImageControls.onImageHover(event, data));

        // //for each display location button
        // //add a click event listener
        // locationButtons.forEach((button) => {
        //     button.addEventListener("click", (event) => SheetImageControls.onDisplayActionButtonClick(event, data));
        // });

        // //for each radio button, which shows the display tiles in scene
        // //add change and hover event listeners
        // tileRadioButtons.forEach((button) => {
        //     button.addEventListener(
        //         "change",
        //         async (event) => await SheetImageControls.onTileRadioButtonChange(event, data)
        //     );
        //     $(button.nextElementSibling).on(
        //         "mouseenter mouseleave",
        //         async (event) => await SheetImageControls.onTileButtonLabelHover(event, data)
        //     );
        // });
    }

    // static async onImageHover(event, data) {
    //     // event.stopPropagation();
    //     // event.stopImmediatePropagation();
    //     let { journalSheet, imgElement } = data;
    //     let imageData = await SheetImageControls.getJournalImageFlagData(journalSheet.object, imgElement);

    //     // do not continue this if we find no image data
    //     if (!imageData) {
    //         log(false, "No image data found; Returning!");
    //         return;
    //     }
    //     //we need to get the data for the tile
    //     let isLeave = event.type === "mouseleave" || event.type === "mouseout" ? true : false;
    //     let sceneID = game.scenes.viewed.id;

    //     let tileID = imageData.scenesData.find((sceneData) => sceneData.sceneID === sceneID)?.selectedTileID;
    //     if (!tileID) {
    //         log(false, ["No tile with this id ", tileID, "found in scene", sceneID]);
    //         return;
    //     }
    //     let tile = await game.JTCS.tileUtils.getTileObjectByID(tileID);
    //     if (isLeave) {
    //         await game.JTCS.indicatorUtils.hideTileIndicator(tile);
    //     } else {
    //         await game.JTCS.indicatorUtils.showTileIndicator(tile);
    //     }
    // }

    /**
     * Returns all the necessary data in a bundled object
     * @param {Object} options - bundled options like the app, the html element, and the imgElement
     * @returns  Object
     */
    static async wrapSheetImageData(options) {
        let { app, html, imgElement } = options;
        //get location data
        console.log(imgElement);
        let imageData = await SheetImageControls.getJournalImageFlagData(app.object, imgElement);
        let galleryTileIDs = await SheetImageControls.getGalleryTileIDsFromImage(imgElement, app);
        let sheetImageData = {
            imageElement: imgElement,
            ...imageData,
            ...galleryTileIDs,
            ...(!imageData.method && { method: options.method || "window" }), //if we don't have a location set, default to window
        };
        return sheetImageData;
    }
    // static async onImageClick(event, data) {
    //     event.stopPropagation();
    //     event.stopImmediatePropagation();

    //     let sheetImageData = await SheetImageControls.wrapSheetImageData(data);

    //     await game.JTCS.imageUtils.manager.determineDisplayMethod(sheetImageData);
    // }

    static async addFadeStylesToSheet(event) {
        event.preventDefault();
        let windowContent = event.currentTarget.closest(".window-content");
        let fadeButtons = windowContent.querySelectorAll(`[data-action="fadeJournal"]`, `[data-action="fadeContent"]`);
        let action = event.currentTarget.dataset.action;
        // let className = location === "fadeContent" ? "fadeAll" : "fade";
        let classNames = ["fade"];
        if (action === "fadeContent") {
            classNames.push("fade-all");
        }

        if (windowContent.classList.contains("fade")) {
            windowContent.classList.remove("fade", "fade-all");
            fadeButtons.forEach((btn) => btn.classList.remove("active"));
        } else {
            windowContent.classList.add(...classNames);
            fadeButtons.forEach((btn) => btn.classList.add("active"));
        }
        return;
    }

    // static async onDisplayActionButtonClick(event, data) {
    //     let { journalSheet, imgElement } = data;
    //     event.stopPropagation();
    //     event.stopImmediatePropagation();

    //     //get the action
    //     let action = event.currentTarget.dataset.action;

    //     if (action === "fadeJournal" || action === "fadeContent") {
    //         await SheetImageControls.addFadeStylesToSheet(event);
    //     }

    //     //if control is pressed down, change the displayLocation to automatically be set to this when you click on the image
    //     if (event.ctrlKey) {
    //         //if the control key was also pressed, store the display location
    //         await SheetImageControls.assignImageFlags(journalSheet, imgElement, {
    //             method: action,
    //         });
    //     } else {
    //         //otherwise, just launch to the clicked button's display location
    //         let sheetImageData = await SheetImageControls.wrapSheetImageData({ ...data, method: action });
    //         await game.JTCS.imageUtils.manager.determineDisplayMethod(sheetImageData);
    //     }
    // }

    // static async onTileButtonLabelHover(event, data = {}) {
    //     let isLeave = event.type === "mouseout" || event.type === "mouseleave";
    //     let tileID = event.currentTarget.previousElementSibling.value; //this should grab the value from the radio button itself
    //     let tile = await game.JTCS.tileUtils.getTileObjectByID(tileID);

    //     if (isLeave) {
    //         await game.JTCS.indicatorUtils.hideTileIndicator(tile);
    //     } else {
    //         await game.JTCS.indicatorUtils.showTileIndicator(tile);
    //     }
    // }

    // static async onTileRadioButtonChange(event, data) {
    //     let { journalSheet, imgElement } = data;
    //     event.stopPropagation();
    //     event.stopImmediatePropagation();
    //     let value = event.currentTarget.value;
    //     let updateData = {
    //         name: imgElement.dataset.name,
    //         scenesData: [
    //             {
    //                 sceneID: game.scenes.viewed.data._id,
    //                 selectedTileID: value,
    //             },
    //         ],
    //     };
    //     await SheetImageControls.assignImageFlags(journalSheet, imgElement, updateData);
    // }

    /**
     * Return data specific to the current viewed scene for the particular image in the journal entry, which should change when the scene does
     * @param {Object} imageFlagData - the data from the flag for this particular image in the journal entry
     * @returns the data specific to the current viewed scene
     */
    static async getSceneSpecificImageData(imageFlagData) {
        let currentSceneID = game.scenes.viewed.data._id;
        return imageFlagData.scenesData?.find((obj) => obj.sceneID === currentSceneID); //want to get the specific data for the current scene
    }

    static async getGalleryTileIDsFromImage(imageElement, journalSheet) {
        let imageData = await SheetImageControls.getJournalImageFlagData(journalSheet.object, imageElement);
        if (!imageData) {
            console.error("could not get data from that sheet and element");
            return;
        }
        imageData = await SheetImageControls.getSceneSpecificImageData(imageData);
        let artTileID = imageData.selectedTileID;
        let frameTileID = game.JTCS.tileUtils.getLinkedFrameID;
        if (!artTileID) {
            console.error("Image data has no tile ID");
            return;
        }
        return {
            artTileID: artTileID,
            frameTileID: frameTileID,
        };
    }

    /**
     * Convert the image's path without extention to use as as an identifier to store it in flags
     * @param {Element} imgElement - the image element
     * @returns a string path
     */
    static async convertImageSourceToID(imgElement) {
        let name = imgElement.getAttribute("src");
        name = name.replace(/\.(gif|jpe?g|tiff?|png|webp|bmp)/g, "");
        return name;
    }
    /**
     *  get the flag data for this image in this journal entry
     * @param {Document} journalEntry - the journal entry whose flags we're looking in
     * @param {Element} imgElement - an HTML Image Element
     * @returns an object containing the data saved in the flags
     */
    static async getJournalImageFlagData(journalEntry, imgElement) {
        let clickableImages = (await journalEntry.getFlag("journal-to-canvas-slideshow", "clickableImages")) || [];
        let foundData = clickableImages.find((imgData) => {
            return imgData.name == imgElement.dataset["name"];
        });
        return { journalID: journalEntry.id, ...foundData };
    }
}
