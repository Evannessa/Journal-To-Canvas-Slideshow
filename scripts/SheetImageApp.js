"use strict";
import { log } from "./debug-mode.js";
import { HelperFunctions } from "./classes/HelperFunctions.js";
import { sheetImageActions } from "./SheetImageActions.js";
import { SheetImageDataController } from "./SheetImageDataController.js";
export class SheetImageApp {
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
                SheetImageApp.injectImageControls(img, app)
            );
        }
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
        await SheetImageApp.setJournalFadeOpacity(journalSheet);

        let template = "modules/journal-to-canvas-slideshow/templates/image-controls.hbs";

        let imageName = await SheetImageDataController.convertImageSourceToID(imgElement);
        imgElement.dataset.name = imageName;

        //get the flags for this particular journal entry
        // let imageFlagData = await SheetImageDataController.getJournalImageFlagData(journalSheet.object, imgElement);

        // log(false, ["Our image data is", imageFlagData]);

        // if (imageFlagData) {
        //     imageFlagData = imageFlagData.scenesData?.find((obj) => obj.sceneID === game.scenes.viewed.data._id); //want to get the specific data for the current scene
        // }

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
            displayMethods: SheetImageApp.displayMethods,
            displayTiles: displayTiles,
            imgPath: imageName,
            users: users,
            // ...imageFlagData,
        });

        //wrap each image in a clickableImageContainer
        $(imgElement).wrap("<div class='clickableImageContainer'></div>");

        $(imgElement).parent().append(renderHtml);
        await SheetImageApp.activateEventListeners({
            controlsContainer: $(imgElement).parent(),
            journalSheet: journalSheet,
            imgElement: imgElement,
        });
    }

    // handle any interaction event
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
                parentItem: imgElement.closest(".clickableImageContainer"),
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
        let { journalSheet, imgElement, controlsContainer } = data;
        let html = journalSheet.element;
        //add data actions to the images
        $(imgElement).attr("data-hover-action", "image.hover.showTileIndicator");
        $(imgElement).attr("data-action", "image.click.sendImageDataToDisplay");

        $(controlsContainer)
            .off("click", "[data-action]")
            .on(
                "click",
                "[data-action]",
                async (event) => await SheetImageApp.handleAction(event, journalSheet, "action")
            );
        $(controlsContainer)
            .off("mouseenter mouseleave", "[data-hover-action]")
            .on(
                "mouseenter mouseleave",
                "[data-hover-action]",
                async (event) => await SheetImageApp.handleAction(event, journalSheet, "hoverAction")
            );
        $(controlsContainer)
            .off("change", "[data-change-action]")
            .on(
                "change",
                "[data-change-action]",
                async (event) => await SheetImageApp.handleAction(event, journalSheet, "changeAction")
            );
    }

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
}
