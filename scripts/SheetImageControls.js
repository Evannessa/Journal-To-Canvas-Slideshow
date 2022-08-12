"use strict";
import { log } from "./debug-mode.js";

export class SheetImageControls {
    static displayLocations = [
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
            name: "displayScene",
            icon: "far fa-image",
            tooltip: "display image in dedicated scene",
        },
        {
            name: "anyScene",
            icon: "fas fa-vector-square",
            tooltip: "display image in any scene with a frame tile and display tile",
        },
        // {
        //     name: "showToAll",
        //     icon: "fas fa-users",
        //     tooltip: "show to all users",
        //     additionalClass: "toggle push-down",
        //     additionalParentClass: "hover-reveal-right",
        //     multi: true,
        // },
        {
            name: "fadeJournal",
            icon: "fas fa-eye-slash",
            tooltip: "Fade journal background to see canvas",
            additionalClass: "toggle push-down",
            additionalParentClass: "hover-reveal-right",
            multi: true,
            childButtons: [
                {
                    name: "fadeContent",
                    icon: "far fa-print-slash",
                    tooltip: "Fade journal AND all its content",
                    additionalClass: "toggle",
                },
            ],
        },
    ];

    /**
     *
     * @param {Object} journalEntry - set a dedicated journal entry
     */
    static async setDisplayJournal(journalEntry) {
        game.JTCS.displayJournal = journalEntry;
    }

    /**
     *
     * @param {Object} displayScene - set a dedicated display
     */
    static async setDisplayScene(scene) {
        game.JTCS.displayScene = scene;
    }

    static async applyImageClasses(app, html) {
        if (game.user.isGM) {
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

        let clickableImages = (await journalEntry.getFlag("journal-to-canvas-slideshow", "clickableImages")) || [];

        if (clickableImages.find((imgData) => imgData.name === imageName)) {
            clickableImages = clickableImages.map((imgData) => {
                log(false, `${imageName} already exists as a flag. Updating with`, newImgData);
                // if the ids match, update the matching one with the new displayName
                return imgData.name === imageName ? { ...imgData, ...newImgData } : imgData; //else just return the original
            });
        } else {
            log(false, `Doesn't exist yet. Adding ${imageName} to flags with data`, newImgData);
            clickableImages.push({ name: imageName, ...newImgData });
        }

        await journalEntry.setFlag("journal-to-canvas-slideshow", "clickableImages", clickableImages);
    }

    static async setJournalFadeOpacity(journalSheet) {
        let opacityValue = game.JTCS.utils.getSettingValue("journalFadeOpacity");
        // game.settings.get("journal-to-canvas-slideshow", "journalFadeOpacity");
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
            displayLocations: SheetImageControls.displayLocations,
            displayTiles: displayTiles,
            imgPath: imageName,
            users: users,
            ...imageFlagData,
        });
        $(imgElement).parent().addClass("clickableImageContainer");
        $(imgElement).parent().append(renderHtml);
        await SheetImageControls.activateEventListeners({ journalSheet: journalSheet, imgElement: imgElement });
    }

    /**
     *
     * @param data - the data object
     */
    static async activateEventListeners(data) {
        let { journalSheet, imgElement } = data;

        let locationButtons = imgElement
            .closest(".editor-content")
            .querySelectorAll(`.clickableImageContainer .displayLocations button`);

        let tileRadioButtons = imgElement
            .closest(".editor-content")
            .querySelectorAll(`.clickableImageContainer .displayTiles input[type="radio"]`);

        imgElement.addEventListener("click", async (event) => await SheetImageControls.onImageClick(event, data));
        $(imgElement).on("mouseenter mouseleave", async (event) => await SheetImageControls.onImageHover(event, data));

        //for each display location button
        //add a click event listener
        locationButtons.forEach((button) => {
            button.addEventListener("click", (event) => SheetImageControls.onLocationButtonClick(event, data));
        });

        //for each radio button, which shows the display tiles in scene
        //add change and hover event listeners
        tileRadioButtons.forEach((button) => {
            button.addEventListener(
                "change",
                async (event) => await SheetImageControls.onTileRadioButtonChange(event, data)
            );
            $(button.nextElementSibling).on(
                "mouseenter mouseleave",
                async (event) => await SheetImageControls.onTileButtonLabelHover(event, data)
            );
        });
    }

    static async onImageHover(event, data) {
        // event.stopPropagation();
        // event.stopImmediatePropagation();
        let { journalSheet, imgElement } = data;
        let imageData = await SheetImageControls.getJournalImageFlagData(journalSheet.object, imgElement);

        // do not continue this if we find no image data
        if (!imageData) {
            log(false, "No image data found; Returning!");
            return;
        }
        //we need to get the data for the tile
        let isLeave = event.type === "mouseleave" || event.type === "mouseout" ? true : false;
        let sceneID = game.scenes.viewed.id;

        let tileID = imageData.scenesData.find((sceneData) => sceneData.sceneID === sceneID)?.selectedTileID;
        if (!tileID) {
            log(false, ["No tile with this id ", tileID, "found in scene", sceneID]);
            return;
        }
        let tile = await game.JTCS.tileUtils.getTileByID(tileID);
        if (isLeave) {
            await game.JTCS.indicatorUtils.hideTileIndicator(tile);
        } else {
            await game.JTCS.indicatorUtils.showTileIndicator(tile);
        }
    }

    static async onImageClick(event, data) {
        let { journalSheet, imgElement } = data;
        event.stopPropagation();
        event.stopImmediatePropagation();
        //get location data
        let imageData = await SheetImageControls.getJournalImageFlagData(journalSheet.object, imgElement);
        if (imageData.displayLocation) {
            determineDisplayLocation(imgElement, imageData.displayLocation, journalSheet);
        } else {
            determineDisplayLocation(imgElement, "displayScene", journalSheet);
        }
    }

    static async onLocationButtonClick(event, data) {
        let { journalSheet, imgElement } = data;
        event.stopPropagation();
        event.stopImmediatePropagation();

        //get the action
        let location = event.currentTarget.dataset.action;

        if (location === "fadeJournal" || location === "fadeContent") {
            event.preventDefault();
            let windowContent = event.currentTarget.closest(".window-content");
            let fadeButtons = windowContent.querySelectorAll(
                `[data-action="fadeJournal"]`,
                `[data-action="fadeContent"]`
            );
            // let className = location === "fadeContent" ? "fadeAll" : "fade";
            let classNames = ["fade"];
            if (location === "fadeContent") {
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

        //if control is pressed down, change the displayLocation to automatically be set to this when you click on the image
        if (event.ctrlKey) {
            //if the control key was also pressed
            await SheetImageControls.assignImageFlags(journalSheet, imgElement, {
                displayLocation: location,
            });
        } else {
            //otherwise, just launch to the clicked button's display location
            await SheetImageControls.determineDisplayLocation(imgElement, location, journalSheet);
        }
    }

    static async onTileButtonLabelHover(event, data = {}) {
        let isLeave = event.type === "mouseout" || event.type === "mouseleave";
        let tileID = event.currentTarget.previousElementSibling.value; //this should grab the value from the radio button itself
        let tile = await game.JTCS.tileUtils.getTileByID(tileID);

        if (isLeave) {
            await game.JTCS.indicatorUtils.hideTileIndicator(tile);
        } else {
            await game.JTCS.indicatorUtils.showTileIndicator(tile);
        }
    }

    static async onTileRadioButtonChange(event, data) {
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
    }

    /**
     * Return data specific to the current viewed scene for the particular image in the journal entry, which should change when the scene does
     * @param {Object} imageFlagData - the data from the flag for this particular image in the journal entry
     * @returns the data specific to the current viewed scene
     */
    static async getSceneSpecificImageData(imageFlagData) {
        let currentSceneID = game.scenes.viewed.data._id;
        return imageFlagData.scenesData?.find((obj) => obj.sceneID === currentSceneID); //want to get the specific data for the current scene
    }

    /**
     * determine the location of the display
     * @param {*} imageElement - the imageElement
     * @param {*} location - the location we want to display our image in
     * @param {*} journalSheet  - the journal sheet in which we're performing these actions
     * @param {*} url
     */
    static async determineDisplayLocation(imageElement, location, journalSheet, url = "") {
        // event.stopPropagation();

        //on click, this method will determine if the image should open in a scene or in a display journal
        switch (location) {
            case "displayScene":
            case "anyScene":
                //if the setting is to display it in a scene, proceed as normal
                await game.JTCS.imageUtils.displayImageInScene(imageElement, journalSheet, url);
                break;
            case "journalEntry":
                await game.JTCS.imageUtils.displayImageInWindow(
                    "journalEntry",
                    game.JTCS.imageUtils.getImageSource(imageElement)
                );
                break;
            case "window":
                await game.JTCS.imageUtils.displayImageInWindow(
                    "window",
                    game.JTCS.imageUtils.getImageSource(imageElement)
                );
                if (url != undefined) {
                    //if the url is not undefined, it means that this method is being called from the setUrlImageToShow() method
                } else {
                    //if not, it happened because of an image click, so find the information of the clicked image
                    game.JTCS.imageUtils.getImageSource(imageElement, displayImageInWindow);
                }
                break;
        }
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
        return foundData;
    }
}
