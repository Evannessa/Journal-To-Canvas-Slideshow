"use strict";
import { log } from "./debug-mode.js";
import { HelperFunctions } from "./classes/HelperFunctions.js";
import { sheetImageActions, sheetControls } from "./SheetImageActions.js";
import { SheetImageDataController } from "./SheetImageDataController.js";
import { artTileManager, helpers } from "./data/ModuleManager.js";
import { ArtTileManager } from "./classes/ArtTileManager.js";
import { universalInterfaceActions } from "./data/Universal-Actions.js";



export class SheetImageApp {
    static displayMethods = [
        {
            name: "anyScene",
            icon: "fas fa-vector-square",
            tooltip: "choose Art Tile in current scene to display image on",
        },
        {
            name: "window",
            icon: "fas fa-external-link-alt",
            tooltip: "Display image in pop-out window",
        },
        {
            name: "journalEntry",
            icon: "fas fa-book-open",
            tooltip: "display image in your chosen 'Art Journal'",
        },
        {
            name: "artScene",
            icon: "far fa-image",
            tooltip: "display image in your chosen 'Art Scene'",
        },
    ];

    /**
     *
     * @param {*} app - the application (sheet) that this is being called from
     * @param {*} html
     */
    static async applyImageClasses(app, html) {
        if (game.user.isGM) {
            const whichSheets = await HelperFunctions.getSettingValue(
                "artGallerySettings",
                "sheetSettings.modularChoices"
            );
            const doc = app.document;
            let onThisSheet = await HelperFunctions.getFlagValue(
                doc,
                "showControls",
                "",
                false
            );

            let documentName = doc.documentName;
            documentName = documentName.charAt(0).toLowerCase() + documentName.slice(1);
            // if (documentName === "item" && doc.parent) {
            //     //if it's an embedded item in a sheet
            //     return;
            // }
            // for v10 +
            if (game.version >= 10) {
                if (documentName === "journalEntryPage") {
                    documentName = "journalEntry";
                    onThisSheet = await HelperFunctions.getFlagValue(
                        doc.parent,
                        "showControls",
                        "",
                        false
                    );
                }
            }
            let selectorString = "img, video, .lightbox-image";
            if (whichSheets[documentName] || onThisSheet === true) {
                if (onThisSheet) {
                    if (documentName === "journalEntry" && game.version < 10) {
                        html.find(selectorString).addClass("clickableImage");
                    } else {
                        html.find(selectorString).addClass("rightClickableImage");
                    }
                    //inject the controls into every image that has the clickableImage or rightClickableImage classes

                    Array.from(
                        html.find(".clickableImage, .rightClickableImage")
                    ).forEach((img) => SheetImageApp.injectImageControls(img, app));
                }
            }
            if(game.modules.get("monks-enhanced-journal").active){

                console.log("Monks is active")
                SheetImageApp.injectSheetWideControls(app)
            }else{
                if (doc.documentName !== "JournalEntryPage") {
                    SheetImageApp.injectSheetWideControls(app);
                }
            }
        }
    }

    static async applySheetFadeSettings(journalSheet) {
        //get opacity, and whether or not journals should be faded
        let opacityValue = (
            await game.JTCS.utils.getSettingValue(
                "artGallerySettings",
                "sheetFadeOpacityData"
            )
        ).value;
        let shouldFadeImages = (
            await game.JTCS.utils.getSettingValue(
                "artGallerySettings",
                "fadeSheetImagesData"
            )
        ).chosen;
        //set a CSS variable on the journal sheet to grab the opacity in css
        let sheetElement = journalSheet.element;
        sheetElement[0].style.setProperty("--journal-fade", opacityValue + "%");

        //set the window content's data-attribute to "data-fade-all" so it fades the journal's opacity, and not just the background color
        if (shouldFadeImages === "fadeAll") {
            sheetElement.find(".window-content").attr("data-fade-all", true);
            // sheetElementStyle.setProperty("--fade-all", true);
        }
    }

    /**
     *  When the journal sheet renders, we're going to add controls over each image
     * @param {HTMLElement} imgElement - the image HTML element
     * @param {*} journalSheet - the journal sheet we're searching within
     */
    static async injectImageControls(imgElement, journalSheet) {
        let template = "modules/journal-to-canvas-slideshow/templates/image-controls.hbs";
        // game.JTCS.templates["image-controls"]
        const defaultArtTileID = await ArtTileManager.getDefaultArtTileID();

        const imageName = await SheetImageDataController.convertImageSourceToID(
            imgElement
        );
        imgElement.dataset.name = imageName;

        //get the art tiles in the scene
        let displayTiles = await ArtTileManager.getSceneSlideshowTiles("art", true);
        displayTiles = displayTiles.filter((tile) => !tile.missing);
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
            defaultArtTileID: defaultArtTileID,
            imgPath: imageName,
            users: users,
            // ...imageFlagData,
        });

        //wrap each image in a clickableImageContainer
        $(imgElement).wrap("<div class='clickableImageContainer'></div>");

        $(imgElement).parent().append(renderHtml);
        await SheetImageApp.activateImageEventListeners({
            controlsContainer: $(imgElement).parent(),
            journalSheet: journalSheet,
            imgElement: imgElement,
        });
    }
    static async injectSheetWideControls(journalSheet) {
        let template = game.JTCS.templates["sheet-wide-controls"];
      //  await SheetImageApp.applySheetFadeSettings(journalSheet);
        let isActive = await HelperFunctions.getFlagValue(
            journalSheet.document,
            "showControls",
            "",
            false
        );
        let controlsData = sheetControls.map((control) =>
            control.toggle ? { ...control, active: isActive } : control
        );
        let renderHtml = await renderTemplate(template, {
            controls: controlsData,
            isActive,
        });
        let selector = ".window-content";
        let targetElement
        if(journalSheet instanceof jQuery){
            // console.log(journalSheet)
            targetElement = journalSheet[0]
        }else{
            targetElement = journalSheet.element[0]
            if (journalSheet.document.documentName === "JournalEntryPage") {
                selector = ".journal-page-content";
            }
        }
        if(game.modules.get("monks-enhanced-journal").active){
            // selector = ".monks-enhanced-journal .mainbar"
            selector = ".editor-content"
        }
        let $editorElement = $(targetElement.querySelector(selector));
        $editorElement.prepend(renderHtml);
        let controlsContainer = $("#sheet-controls");
        await SheetImageApp.activateSheetWideEventListeners({
            controlsContainer,
            journalSheet,
            isActive,
        });
    }

    static async activateSheetWideEventListeners(options) {
        const { journalSheet, isActive } = options;
        const controlsContainer = journalSheet.element.find("#sheet-controls");
        $(controlsContainer)
            .off("click", "[data-action]")
            .on("click", "[data-action]", async (event) => {
                SheetImageApp.handleAction(event, journalSheet, "action", false);
            });
        const controlsToggleButton = $(controlsContainer).find(
            "[data-action='sheet.click.toggleImageControls']"
        )[0];
        if (isActive) {
            $(controlsToggleButton).addClass("active");
        }
        universalInterfaceActions.toggleHideAllSiblings(null, controlsToggleButton);
    }

    // handle any interaction event
    static async handleAction(event, journalSheet, actionType = "action", isItem = true) {
        event.preventDefault();
        let targetElement = $(event.currentTarget);
        let imgElement;

        //"isItem" stands for if it's a sheet-wide control or an item-specific control
        if (isItem) {
            //if our target element is not an image, get the closest image from our clickableImageContainer parent
            //else just get the current target itself

            if (
                targetElement.prop("nodeName") !== "IMG" ||
                targetElement.prop("nodeName") !== "VIDEO"
            ) {
                imgElement = targetElement[0]
                    .closest(".clickableImageContainer")
                    .querySelector("img, video");
            } else {
                imgElement = targetElement[0];
            }
            //if our target element is a label, get the input before it instead
            targetElement.prop("nodeName") === "LABEL" &&
                (targetElement = targetElement.prev());
        }

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
                ...(imgElement && {
                    parentItem: imgElement.closest(".clickableImageContainer"),
                }),
                imgElement: imgElement,
            };
            actionData[handlerPropertyString](event, options);
        }
    }

    /**
     *
     * @param data - the data object
     */
    static async activateImageEventListeners(data) {
        let { journalSheet, imgElement, controlsContainer } = data;
        let html = journalSheet.element;
        //add data actions to the images
        $(imgElement).attr("data-hover-action", "image.hover.showTileIndicator");
        $(imgElement).attr("data-action", "image.click.sendImageDataToDisplay");

        $(controlsContainer)
            .off("click contextmenu", "[data-action]")
            .on(
                "click contextmenu",
                "[data-action]",
                async (event) =>
                    await SheetImageApp.handleAction(event, journalSheet, "action")
            );
        $(controlsContainer)
            .off("mouseenter mouseleave", "[data-hover-action]")
            .on(
                "mouseenter mouseleave",
                "[data-hover-action]",
                async (event) =>
                    await SheetImageApp.handleAction(event, journalSheet, "hoverAction")
            );
        $(controlsContainer)
            .off("change", "[data-change-action]")
            .on(
                "change",
                "[data-change-action]",
                async (event) =>
                    await SheetImageApp.handleAction(event, journalSheet, "changeAction")
            );
    }

    static async addFadeStylesToSheet(event) {
        event.preventDefault();

        let windowContent = event.currentTarget.closest(".window-content");
        let faded =
            windowContent.classList.contains("fade") ||
            windowContent.classList.contains("fade-all");

        if (faded) {
            windowContent.classList.remove("fade");
        } else {
            windowContent.classList.add("fade");
        }
    }
}
