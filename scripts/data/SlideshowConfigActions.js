"use strict";
import { JTCSSettingsApplication } from "../classes/JTCSSettingsApplication.js";
import { JTCSActions } from "./JTCS-Actions.js";
import { Popover } from "../classes/PopoverGenerator.js";
import { universalInterfaceActions as UIA } from "./Universal-Actions.js";
import { HelperFunctions } from "../classes/HelperFunctions.js";
import { ImageDisplayManager } from "../classes/ImageDisplayManager.js";
import { ArtTileManager } from "../classes/ArtTileManager.js";

/**
 * Show instructions
 */

export const extraActions = {
    renderTileConfig: async (event, options = {}) => {
        let { tileID } = options;
        await ArtTileManager.renderTileConfig(tileID);
    },
    selectTile: async (event, options = {}) => {
        let { tileID } = options;
        await ArtTileManager.selectTile(tileID);
    },
    updateTileData: async (event, options = {}) => {
        let clickedElement = $(event.currentTarget);

        let { name, value } = event.currentTarget;

        let { tileID, app, parentLI } = options;

        let action = clickedElement.data().action || clickedElement.data().changeAction;

        let { type } = $(parentLI).data();

        let isNewTile = false;
        let isBoundingTile = type === "frame";

        if (action.includes("createNewTileData")) {
            isNewTile = true;
            tileID = `unlinked${foundry.utils.randomID()}`;
            name = "displayName";
            value = `Untitled ${type} Tile`;
        } else {
            // if we're already a Slideshow tile, look for our ID
            tileID = clickedElement[0].closest(".tile-list-item, .popover").dataset.id;
        }

        if (tileID) {
            let updateData = {
                id: tileID,
                [name]: value,
                ...(isNewTile ? { isBoundingTile: isBoundingTile } : {}),
            };
            await ArtTileManager.updateSceneTileFlags(updateData, tileID);
            await app.renderWithData();
        }
    },
    deleteTileData: async (event, options = {}) => {
        const { app, tileID, parentLI } = options;
        let type = parentLI.dataset.type;
        let displayName = await ArtTileManager.getGalleryTileDataFromID(tileID, "displayName");
        const templatePath = game.JTCS.templates["delete-confirmation-prompt"];
        const buttons = {
            cancel: {
                label: "Cancel",
                icon: "<i class='fas fa-undo'></i>",
            },
            delete: {
                label: "Delete Gallery Tile",
                icon: "<i class='fas fa-trash'></i>",
                callback: async () => {
                    await ArtTileManager.deleteSceneTileData(tileID);
                    await app.renderWithData();
                },
            },
        };
        type = type.charAt(0).toUpperCase() + type.slice(1);
        const data = {
            icon: "fas fa-trash",
            heading: "Delete Art Tile Data?",
            destructiveActionText: `delete this ${type} tile data?`,
            explanation: `This will permanently delete`,
            lossDataList: [`${type} Tile '${displayName}'`],
            explanation2: `With no way to get it back`,
            buttons,
        };
        await HelperFunctions.createDialog("Delete Art Tile", templatePath, data);
    },
    highlightItemAndTile: async (event, options = {}) => {
        let { parentLI, tileID, missing } = options;
        // if (missing) {
        //     return;
        // }
        let { type, frameId: frameID } = $(parentLI).data();
        let isLeave = event.type === "mouseleave" ? true : false;
        // we want every hover over a tile to highlight the tiles it is linked to

        let hoveredElement = $(event.currentTarget);

        // let type = hoveredElement.data().type;
        // let id = hoveredElement.data().id;

        let otherListItems = [];
        if (type === "frame") frameID = tileID;

        if (frameID) {
            otherListItems = Array.from(hoveredElement[0].closest(".tilesInScene").querySelectorAll("li")).filter(
                //get list items with the opposite tile type
                (item) => {
                    let passed = true;
                    if (item.dataset.type === type) {
                        passed = false;
                    }
                    if (item.dataset.flag === "ignoreHover") {
                        passed = false;
                    }
                    return passed;
                }
            );

            //filter out list items
            otherListItems = otherListItems.filter((element) => {
                let dataset = Object.values({ ...element.dataset }).join(" ");
                let match = false;
                if (type === "art") {
                    //for art tiles, we're looking for frameTiles in the list that match the frame id
                    match = dataset.includes(frameID);
                } else if (type === "frame") {
                    //for frame tiles, we're looking for art tiles in the list that have our id
                    match = dataset.includes(tileID);
                }
                return match;
            });
        }
        // if (!tileID) {
        //     return;
        // }
        let tile;
        if (!missing) tile = await ArtTileManager.getTileObjectByID(tileID);
        if (isLeave) {
            hoveredElement.removeClass("accent border-accent");
            $(otherListItems).removeClass("accent border-accent");
            if (!missing) game.JTCS.indicatorUtils.hideTileIndicator(tile);
        } else {
            hoveredElement.addClass("accent border-accent");
            $(otherListItems).addClass("accent border-accent");
            if (!missing) game.JTCS.indicatorUtils.showTileIndicator(tile);
        }
    },
    setDefaultTileInScene: async (event, options = {}) => {
        if (event.ctrlKey || event.metaKey) {
            //if the ctrl or meta (cmd) key on mac is pressed
            let { tileID, parentLI } = options;
            let type = parentLI.dataset.type;
            let tileInScene = await ArtTileManager.getTileObjectByID(tileID);
            let displayName = await ArtTileManager.getGalleryTileDataFromID(tileID, "displayName");

            if (tileInScene) {
                await ArtTileManager.setDefaultArtTileID(tileID, game.scenes.viewed);
            } else {
                ui.notifications.warn(
                    `Gallery ${HelperFunctions.capitalizeEachWord(type)} 
                    Tile "${displayName}"
                    must be linked to a tile in this scene 
                    before it can be set as default`
                );
            }
        }
    },
    showURLShareDialog: async (event, options = {}) => {
        let wrappedActions = {};
        let { displayActions } = JTCSActions;
        for (let actionName in displayActions) {
            wrappedActions[actionName] = { ...displayActions[actionName] };

            //converting properties to fit the dialog's schema
            wrappedActions[actionName].icon = `<i class='${displayActions[actionName].icon}'></i>`;
            // wrappedActions[actionName].label = HelperFunctions.capitalizeEachWord(actionName, "");
            wrappedActions[actionName].callback = async (html) => {
                let urlInput = html.find("input[name='urlInput']");
                let url = urlInput.val();
                if (url !== "") {
                    await ImageDisplayManager.determineDisplayMethod({
                        method: actionName,
                        url: url,
                    });
                }
            };
        }
        delete wrappedActions.anyScene;
        let buttons = {
            ...wrappedActions,
            cancel: {
                label: "Cancel",
            },
        };
        let templatePath = game.JTCS.templates["share-url-partial"];

        await HelperFunctions.createDialog("Share URL", templatePath, {
            buttons: buttons,
            partials: game.JTCS.templates,
            value: "",
        });
    },
    showInstructions: async (event, options = {}) => {
        const { html, type, isDefault, missing, frameId, tileID } = options;
        const areVisible = await HelperFunctions.getSettingValue("areConfigInstructionsVisible");
        const instructionsElement = html.find("#JTCS-config-instructions");
        const isLeave = event.type === "mouseleave" || event.type === "mouseout" ? true : false;

        if ((!instructionsElement && !isLeave) || !areVisible) {
            //if the instructions element already exists and we're mousing over, or the instruction visibility has been toggled off
            //return
            return;
        }

        let instructionsContent = "<div class='instructions__content hidden'>";
        // add different instruction content depending on the tile's type (art or frame), whether it's unlinked/missing, and whether, if it's an art tile, it's currently set to the default art tile.
        const defaultVariantText = isDefault ? "<em>another</em>" : "this";
        switch (type) {
            case "art":
                instructionsContent += `<p id="isArtTile">
                ${isDefault ? "This art tile is set as Default." : ""}
                <code>Ctr + Click</code> on ${defaultVariantText} <span class="art-color">Art Tile</span> to set it to <span class='default-color'>Default</span>.
                <br/> 
                If you don't specify where a Sheet Image will display, it will automatically display on the <span class="default-color">"Default"</span>
                 <span class="art-color">Art Tile</span> in a scene.
                </p>`;
                break;
            case "frame":
                if (!missing) {
                    instructionsContent += `<p id="isFrameTile"><span class="frame-color">Frame tiles</span> act as "boundaries" for <span class="art-color">Art Tiles</span>, like a 'picture frame'. <br/>
                When you link an <span class="art-color">Art Tile</span> to a <span class="frame-color">Frame tile</span>, the <span class="art-color">Art Tile</span> will get no larger than the <span class="frame-color">Frame Tile</span>.</p>`;
                }
                break;
        }
        if (missing) {
            const tileName = await ArtTileManager.getGalleryTileDataFromID(tileID, "displayName");
            let suffix = `<span class='${type}-color'>${HelperFunctions.capitalizeEachWord(
                type
            )} Tile "${tileName}"</span>`;
            instructionsContent += `<p id="missing">This <span class='${type}-color'>${HelperFunctions.capitalizeEachWord(
                type
            )} Tile</span> tile is <b>unlinked</b> to any tile on the canvas in this scene.</p>
            <ul>
                <li>Click on <i class="fas fa-plus"></i> to add a new Tile object to the canvas, linked to ${suffix}</li>
                <li>Click on <i class="fas fa-link"></i> to link a pre-existing Tile object on the canvas to ${suffix}</li>
            </ul>
            
            `;
        }
        if (type === "art" && !frameId)
            instructionsContent += `<p id="noFrameTile">This <span class="art-color">Art Tile</span> will be bound by the scene's canvas.</p>`;
        else if (type === "art" && frameId) {
            const frameTileName = await ArtTileManager.getGalleryTileDataFromID(frameId, "displayName");
            instructionsContent += `<p id="hasFrameTile">This <span class="art-color">Art Tile</span> will be bound by frame tile <span class="frame-color">${frameTileName}</span> </p>`;
        }
        instructionsContent += "</div>";
        let content = instructionsElement.find(".instructions__content");
        instructionsElement.contentHidden = true;

        if (!isLeave) {
            content.replaceWith(`${instructionsContent}`);
            let element = instructionsElement[0];
            UIA.toggleShowAnotherElement(event, {
                parentItem: element,
                targetClassSelector: "instructions__content",
                fadeIn: false,
            });
        } else {
            if (!instructionsElement.contentHidden) {
                instructionsElement.contentHidden = true;
            }
            if (instructionsElement.timeout) {
                clearTimeout(instructionsElement.timeout);
            }
            instructionsElement.timeout = setTimeout(async () => {
                await UIA.fade(content, {
                    duration: 200,
                    isFadeOut: true,
                    onFadeOut: async () => {
                        content.replaceWith(`<div class="instructions__content hidden"></div>`);
                        instructionsElement.contentHidden = true;
                        // content.addClass("hidden");
                    },
                });
            }, 300);
        }
    },
    toggleInstructionsVisible: async (event, options = {}) => {
        let areVisible = await HelperFunctions.getSettingValue("areConfigInstructionsVisible");
        await HelperFunctions.setSettingValue("areConfigInstructionsVisible", !areVisible);
        UIA.toggleActiveStyles(event);
    },
    /**
     * Lower the opacity of every other tile in the scene, to see this one more clearly
     * @param {HTMLEvent} event - the triggering event
     * @param {Object options  - an options object
     * @param {String} options.tileID - the ID of the Art Gallery tile we're operating upon
     */
    toggleTilesOpacity: async (event, options = {}) => {
        const { tileID } = options;
        const btn = event.currentTarget;
        const clickAction = btn.dataset.action;
        const removeFade = btn.classList.contains("active") ? true : false;
        const alphaValue = removeFade ? 1.0 : 0.5;

        //get other buttons from other Tile Items that may be set to active, and so we can toggle them off
        let otherToggleFadeButtons = btn
            .closest(".tilesInScene")
            .querySelectorAll(`[data-action='${clickAction}'].active`);

        //filter any button that has the same parent tile item out
        otherToggleFadeButtons = Array.from(otherToggleFadeButtons).filter(
            (fadeBtn) => fadeBtn.closest(".tile-list-item").dataset.id !== tileID
        );

        const otherTiles = game.scenes.viewed.tiles.contents.filter((tile) => tile.id !== tileID);

        otherTiles.forEach((tile) => {
            tile.object.alpha = alphaValue;
        });

        const ourTile = game.scenes.viewed.tiles.get(tileID);
        ourTile.object.alpha = 1.0;

        //toggle this button active
        if (otherToggleFadeButtons.length > 0) {
            UIA.clearOtherActiveStyles(event, btn, `[data-action='${clickAction}']`, ".tilesInScene");
        }
        UIA.toggleActiveStyles(event);
        //toggle any other active buttons to be inactive
        // Array.from(otherToggleFadeButtons).forEach((el) => UIA.toggleActiveStyles(event, el));
    },
    toggleSheetOpacity: async (event, options = {}) => {
        UIA.fadeSheetOpacity(event);
        UIA.toggleActiveStyles(event);
    },
};
export const slideshowDefaultSettingsData = {
    globalActions: {
        click: {
            propertyString: "globalActions.click.actions",
            actions: {
                showURLShareDialog: {
                    icon: "fas fa-external-link-alt",
                    tooltipText: "Share a URL link with your players",
                    onClick: extraActions.showURLShareDialog,
                },
                showModuleSettings: {
                    icon: "fas fa-cog",
                    tooltipText: "Open Journal-to-Canvas Slideshow Art Gallery Settings",
                    onClick: (event, options = {}) => {
                        UIA.renderAnotherApp("JTCSSettingsApp", JTCSSettingsApplication);
                    },
                },
                toggleInstructionsVisible: {
                    icon: "fas fa-eye-slash",
                    tooltipText: "toggle instruction visibility",
                    renderedInTemplate: true,
                    onClick: async (event, options) => await extraActions.toggleInstructionsVisible(event, options),
                },
                toggleSheetOpacity: {
                    icon: "fas fa-eye-slash",
                    tooltipText: "fade this application to better see the canvas",
                    onClick: async (event, options) => await extraActions.toggleSheetOpacity(event, options),
                },
                // showArtScenes: {
                //     icon: "fas fa-map",
                //     tooltipText: "Show art scenes",
                //     onClick: async (event, options = {}) => {
                //         //display the art scenes (scenes that currently have slideshow data)
                //         let artScenes = await ArtTileManager.getAllScenesWithSlideshowData();
                //         let chosenArtScene = await HelperFunctions.getSettingValue(
                //             "artGallerySettings",
                //             "dedicatedDisplayData.scene.value"
                //         );
                //         let artSceneItems = {};

                //         artScenes.forEach((scene) => {
                //             artSceneItems[scene.name] = {
                //                 icon: scene.thumbnail,
                //                 dataset: {},
                //             };
                //         });

                //         let context = {
                //             propertyString: "globalActions.click.actions",
                //             items: artSceneItems,
                //         };
                //         let templateData = Popover.createTemplateData(parentLI, "item-menu", context);
                //         let elementData = { ...Popover.defaultElementData };

                //         elementData["popoverElement"] = {
                //             targetElement: null,
                //             hideEvents: [
                //                 {
                //                     eventName: "change",
                //                     selector: "input",
                //                     wrapperFunction: async (event) => {
                //                         let url = event.currentTarget.value;
                //                         let valid = HelperFunctions.manager.validateInput(url, "image");
                //                         if (valid) {
                //                             await ImageDisplayManager.updateTileObjectTexture(
                //                                 tileID,
                //                                 frameTileID,
                //                                 url,
                //                                 "anyTile"
                //                             );
                //                         } else {
                //                             ui.notifications.error("URL not an image");
                //                             //TODO: show error?
                //                         }
                //                     },
                //                 },
                //             ],
                //         };

                //         let popover = await Popover.processPopoverData(
                //             event.currentTarget,
                //             app.element,
                //             templateData,
                //             elementData
                //         );
                //         popover[0].querySelector("input").focus({ focusVisible: true });
                //     },
                // },
                // showArtSheets: {},
                createNewTileData: {
                    icon: "fas fa-plus",
                    tooltipText: "Create new tile data",
                    renderedInTemplate: true,
                    onClick: async (event, options) => await extraActions.updateTileData(event, options),
                },
            },
        },
        change: {
            propertyString: "globalActions.change.actions",
            actions: {
                setArtScene: {
                    onChange: async (event, options = {}) => {
                        let { app } = options;
                        let value = event.currentTarget.value;
                        await HelperFunctions.setSettingValue(
                            "artGallerySettings",
                            value,
                            "dedicatedDisplayData.scene.value"
                        );
                        await app.renderWithData();
                    },
                },
                setArtJournal: {
                    onChange: async (event, options = {}) => {
                        let { app } = options;
                        let value = event.currentTarget.value;
                        await HelperFunctions.setSettingValue(
                            "artGallerySettings",
                            value,
                            "dedicatedDisplayData.journal.value"
                        );
                        await app.renderWithData();
                    },
                },
            },
        },
        hover: {
            actions: {},
        },
    },
    itemActions: {
        change: {
            propertyString: "itemActions.change.actions",
            actions: {
                setLinkedTile: {
                    onChange: async (event, options = {}) => {
                        let { app, tileID, targetElement } = options;
                        if (!targetElement) targetElement = event.currentTarget;
                        if (!app) app = game.JTCSlideshowConfig;

                        let selectedID = targetElement.value;
                        await ArtTileManager.updateTileDataID(tileID, selectedID);
                        if (app.rendered) {
                            await app.renderWithData();
                        }
                    },
                },
                setFrameTile: {
                    onChange: async (event, options) => await extraActions.updateTileData(event, options),
                },
                setDisplayName: {
                    onChange: async (event, options) => {
                        //validate the input first
                        let isValid = await UIA.validateInput(event, {
                            noWhitespaceStart: {
                                notificationType: "danger",
                                message: "Please enter a name that doesn't start with a white space",
                            },
                        });
                        if (isValid) {
                            await extraActions.updateTileData(event, options);
                        }
                    },
                },
                shareURL: {
                    onChange: async (event, options = {}) => {
                        const { tileID, parentLI } = options;
                        const frameTileID = parentLI.dataset.frameId;
                        const url = event.currentTarget.value;
                        const valid = HelperFunctions.validateInput(url, "image");
                        if (valid) {
                            await ImageDisplayManager.updateTileObjectTexture(tileID, frameTileID, url, "anyScene");
                        } else {
                            ui.notifications.error("URL not an image");
                        }
                    },
                },
            },
        },
        hover: {
            propertyString: "itemActions.hover.actions",
            actions: {
                highlightTile: {
                    onHover: async (event, options = {}) => {
                        let isLeave = event.type === "mouseout" || event.type === "mouseleave";
                        let { targetElement } = options;
                        if (!targetElement) targetElement = event.currentTarget;
                        if (targetElement.tagName === "LABEL") {
                            targetElement = targetElement.previousElementSibling;
                        }
                        let tileID = targetElement.dataset.id;
                        let tile = await ArtTileManager.getTileObjectByID(tileID);
                        if (!isLeave) {
                            await game.JTCS.indicatorUtils.showTileIndicator(tile);
                        } else {
                            await game.JTCS.indicatorUtils.hideTileIndicator(tile);
                        }
                    },
                },
                highlightItemAndTile: {
                    //TODO: refactor the name of this property to include the "showInstructions" method
                    onHover: async (event, options = {}) => {
                        const dataset = $(options.parentLI).data();
                        await extraActions.highlightItemAndTile(event, { ...options, ...dataset });
                        await extraActions.showInstructions(event, { ...options, ...dataset });
                    },
                },
            },
        },
        click: {
            //for buttons
            propertyString: "itemActions.click.actions",
            actions: {
                setAsDefault: {
                    onClick: async (event, options = {}) => {
                        await extraActions.setDefaultTileInScene(event, options);
                    },
                    renderNever: true,
                },
                shareURLOnTile: {
                    icon: "fas fa-external-link-alt",
                    tooltipText: "Share image from a url on this tile",
                    onClick: async (event, options = {}) => {
                        let { tileID, parentLI, app, html } = options;
                        let frameTileID = parentLI.dataset.frameId;
                        let context = {
                            name: "shareUrl",
                            id: "shareURL",
                            changeAction: "itemActions.change.actions.shareURL",
                            label: "Share URL",
                        };

                        let templateData = Popover.createTemplateData(parentLI, "input-with-error", context);

                        let elementData = { ...Popover.defaultElementData };

                        elementData["popoverElement"] = {
                            targetElement: null,
                            // hideEvents: [
                            //     {
                            //         eventName: "change",
                            //         selector: "input",
                            //         wrapperFunction: async (event) => {
                            //             let url = event.currentTarget.value;
                            //             let valid = HelperFunctions.manager.validateInput(url, "image");
                            //             if (valid) {
                            //                 await ImageDisplayManager.updateTileObjectTexture(
                            //                     tileID,
                            //                     frameTileID,
                            //                     url,
                            //                     "anyScene"
                            //                 );
                            //             } else {
                            //                 ui.notifications.error("URL not an image");
                            //             }
                            //         },
                            //     },
                            // ],
                        };

                        let popover = await Popover.processPopoverData(
                            // event.currentTarget,
                            event.target,
                            app.element,
                            templateData,
                            elementData
                        );
                        popover[0].querySelector("input").focus({ focusVisible: true });
                        await app.activateListeners(app.element);
                    },
                    overflow: false,
                    artTileOnly: true,
                },
                createNewGalleryTile: {
                    icon: "fas fa-plus",
                    tooltipText:
                        "Create a new tile object on the canvas in this scene, linked to this art gallery item",
                    overflow: false,
                    renderOnMissing: true,
                    onClick: async (event, options = {}) => {
                        let { tileID, parentLI, app } = options;
                        let isFrameTile = parentLI.dataset.type === "frame";
                        await ArtTileManager.createAndLinkSceneTile({
                            unlinkedDataID: tileID,
                            isFrameTile: isFrameTile,
                        });
                        await app.renderWithData();
                    },
                },
                showUnlinkedTiles: {
                    icon: "fas fa-link",
                    tooltipText: "Show tiles objects on canvas that aren't linked to any art or frame tile data",
                    onClick: async (event, options = {}) => {
                        let { app, tileID, parentLI } = options;

                        let frameTileID;
                        if (!frameTileID) frameTileID = parentLI.dataset.frameId;

                        let artTileDataArray = await ArtTileManager.getSceneSlideshowTiles("", true);
                        let unlinkedTilesIDs = await ArtTileManager.getUnlinkedTileIDs(artTileDataArray);
                        let context = {
                            artTileDataArray: artTileDataArray,
                            unlinkedTilesIDs: unlinkedTilesIDs,
                        };
                        let templateData = Popover.createTemplateData(parentLI, "tile-link-partial", context);

                        let elementData = { ...Popover.defaultElementData };
                        // elementData["popoverElement"].hideEvents.push({
                        //     eventName: "change",
                        //     selector: "input, input + label",
                        //     wrapperFunction: async (event) => {},
                        // });
                        // -- RENDER THE POPOVER
                        let popover = await Popover.processPopoverData(
                            event.target,
                            app.element,
                            templateData,
                            elementData
                        );
                        await app.activateListeners(app.element);
                        popover[0].querySelector("input").focus({ focusVisible: true });

                        return;
                    },
                    overflow: false,
                    renderOnMissing: true,
                },
                toggleTilesOpacity: {
                    icon: "fas fa-clone",
                    tooltipText: "fade out other tiles in scene to better see this one",
                    onClick: async (event, options = {}) => extraActions.toggleTilesOpacity(event, options),
                },
                // the overflow menu should be last
                toggleOverflowMenu: {
                    icon: "fas fa-ellipsis-v",
                    tooltipText: "show menu of extra options for this art tile",
                    overflow: false,
                    renderAlways: true,
                    onClick: async (event, options = {}) => {
                        const { app, tileID, parentLI } = options;
                        if (!tileID) tileID = parentLI.dataset.tileID;
                        const type = parentLI.dataset.type;
                        const parentItemMissing = parentLI.dataset.missing ? true : false;

                        const actions = slideshowDefaultSettingsData.itemActions.click.actions;

                        let overflowActions = {};
                        for (let actionKey in actions) {
                            let { overflow, renderOnMissing, renderAlways, artTileOnly } = actions[actionKey];
                            if (!renderOnMissing) renderOnMissing = false; //if render on missing is undefined, set it to false

                            const shouldRender = renderOnMissing === parentItemMissing; //fif the parent item's missing status and the button's conditional rendering status are equal
                            const mismatchedTypes = type === "frame" && artTileOnly; //if the item should only render on an art tile

                            if (overflow && (shouldRender || renderAlways) && !mismatchedTypes) {
                                //if it's an action to renderon the overflow menu
                                overflowActions[actionKey] = actions[actionKey];
                            }
                        }
                        const context = {
                            propertyString: "itemActions.click.actions",
                            items: overflowActions,
                        };
                        let templateData = Popover.createTemplateData(parentLI, "item-menu", context);

                        const elementData = { ...Popover.defaultElementData };

                        let popover = await Popover.processPopoverData(
                            event.target,
                            app.element,
                            templateData,
                            elementData
                        );

                        await app.activateListeners(app.element);
                        popover.focus({ focusVisible: true });
                    },
                },
                //overflow menu items
                selectTile: {
                    text: "Select tile object",
                    tooltipText: "Select the tile object in this scene",
                    icon: "fas fa-vector-square",
                    overflow: true,
                    renderOnMissing: false,
                    onClick: async (event, options = {}) => await extraActions.selectTile(event, options),
                },
                fitTileToFrame: {
                    icon: "fas fa-expand",
                    tooltipText: "Fit this art tile to its frame",
                    onClick: async (event, options = {}) => {
                        const { parentLI, tileID } = options;
                        const { type, frameId } = $(parentLI).data();
                        if (type === "art") {
                            let path = game.scenes.viewed.tiles.get(tileID).data.img;
                            await ImageDisplayManager.updateTileObjectTexture(tileID, frameId, path, "anyScene");
                        }
                    },
                    overflow: true,
                    artTileOnly: true,
                },
                renderTileConfig: {
                    text: "Render tile object config",
                    tooltipText: "Render the config for the tile object linked to this tile",
                    icon: "fas fa-cog",
                    overflow: true,
                    onClick: async (event, options = {}) => await extraActions.renderTileConfig(event, options),
                    renderOnMissing: false,
                },
                clearTileImage: {
                    icon: "fas fa-times-circle",
                    text: "Clear Tile Image",
                    tooltipText: "'Clear' this tile's image, or reset it to your chosen default",
                    overflow: true,
                    onClick: async (event, options = {}) => {
                        let { tileID } = options;
                        // let tileID = parentElement.dataset.id;
                        await ImageDisplayManager.clearTile(tileID);
                    },
                    extraClass: "danger-text",
                },
                // bringTileToFront: {
                //     text: "Bring tile to front",
                //     tooltipText: "Bring the linked tile to the front"
                //     icon: "fas fa-arrow-to-top",
                // },
                deleteTileData: {
                    icon: "fas fa-trash",
                    tooltipText: `delete this" this.type "tile data?" "<br/>" 
                                        "(this will not delete the tile object in the scene itself)`,

                    overflow: true,
                    renderAlways: true,
                    extraClass: "danger-text",
                    onClick: async (event, options = {}) => extraActions.deleteTileData(event, options),
                },
            },
        },
    },
};
