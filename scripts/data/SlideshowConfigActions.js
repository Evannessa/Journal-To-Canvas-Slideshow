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
        await game.JTCS.tileUtils.renderTileConfig(tileID);
    },
    selectTile: async (event, options = {}) => {
        let { tileID } = options;
        await game.JTCS.tileUtils.selectTile(tileID);
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
                    await game.JTCS.tileUtils.deleteSceneTileData(tileID);
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
        if (!missing) tile = await game.JTCS.tileUtils.getTileObjectByID(tileID);
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
            wrappedActions[actionName] = displayActions[actionName];
            //converting properties to fit the dialog's schema
            wrappedActions[actionName].icon = `<i class='${displayActions[actionName].icon}'></i>`;
            wrappedActions[actionName].label = HelperFunctions.capitalizeEachWord(actionName, "");
            wrappedActions[actionName].callback = async (html) => {
                let urlInput = html.find("input[name='urlInput']");
                let url = urlInput.val();
                if (url !== "") {
                    await game.JTCS.imageUtils.manager.determineDisplayMethod({
                        method: actionName,
                        url: url,
                    });
                }
            };
        }
        delete wrappedActions.fadeJournal;
        delete wrappedActions.anyScene;
        let buttons = {
            ...wrappedActions,
            cancel: {
                label: "Cancel",
            },
        };
        let templatePath = game.JTCS.templates["share-url-partial"];

        await game.JTCS.utils.createDialog("Share URL", templatePath, {
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
            console.log(
                "%cSlideshowConfigActions.js line:237 tileID",
                "color: white; background-color: #007acc;",
                tileID
            );
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
            // let anim = instructionsElement[0].ourAnimation;
            // if (anim && !anim.finished) {
            // anim.finish();
            // anim.pause();
            // anim.reverse();
            // anim.addEventListener("oncancel", async () => {
            //     instructionsElement[0].ourAnimation = await UIA.fade(instructionsElement, {
            //         duration: 200,
            //         isFadeOut: true,
            //         onFadeOut: () => {
            //             instructionsElement.empty();
            //         },
            //     });
            // });
            // } else if (anim && anim.finished) {
            //     instructionsElement[0].ourAnimation = await UIA.fade(instructionsElement, {
            //         duration: 200,
            //         isFadeOut: true,
            //         onFadeOut: () => {
            //             instructionsElement.empty();
            //         },
            //     });
        }

        // instructionsElement.empty();
    },
    toggleInstructionsVisible: async (event, options = {}) => {
        let areVisible = await HelperFunctions.getSettingValue("areConfigInstructionsVisible");
        await HelperFunctions.setSettingValue("areConfigInstructionsVisible", !areVisible);
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
                // showArtScenes: {
                //     icon: "fas fa-map",
                //     tooltipText: "Show art scenes",
                //     onClick: async (event, options = {}) => {
                //         //display the art scenes (scenes that currently have slideshow data)
                //         let artScenes = await game.JTCS.tileUtils.getAllScenesWithSlideshowData();
                //         let chosenArtScene = await game.JTCS.utils.getSettingValue(
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
                //                         let valid = game.JTCS.utils.manager.validateInput(url, "image");
                //                         if (valid) {
                //                             await game.JTCS.imageUtils.manager.updateTileObjectTexture(
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
                        await game.JTCS.utils.setSettingValue(
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
                        await game.JTCS.utils.setSettingValue(
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
                        let tile = await game.JTCS.tileUtils.getTileObjectByID(tileID);
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
                            name: "Share Url",
                            id: "shareURL",
                        };

                        let templateData = Popover.createTemplateData(parentLI, "input-with-error", context);

                        let elementData = { ...Popover.defaultElementData };

                        elementData["popoverElement"] = {
                            targetElement: null,
                            hideEvents: [
                                {
                                    eventName: "change",
                                    selector: "input",
                                    wrapperFunction: async (event) => {
                                        let url = event.currentTarget.value;
                                        let valid = game.JTCS.utils.manager.validateInput(url, "image");
                                        if (valid) {
                                            await game.JTCS.imageUtils.manager.updateTileObjectTexture(
                                                tileID,
                                                frameTileID,
                                                url,
                                                "anyTile"
                                            );
                                        } else {
                                            ui.notifications.error("URL not an image");
                                            //TODO: show error?
                                        }
                                    },
                                },
                            ],
                        };

                        let popover = await Popover.processPopoverData(
                            // event.currentTarget,
                            event.target,
                            app.element,
                            templateData,
                            elementData
                        );
                        popover[0].querySelector("input").focus({ focusVisible: true });
                    },
                    overflow: false,
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

                        let artTileDataArray = await game.JTCS.tileUtils.getSceneSlideshowTiles("", true);
                        let unlinkedTilesIDs = await game.JTCS.tileUtils.getUnlinkedTileIDs(artTileDataArray);
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
                        console.log("Our current target is", event.currentTarget, event.target);
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

                //a more destructive item that should go second-to-last in the list
                clearTileImage: {
                    icon: "fas fa-times-circle",
                    tooltipText: "'Clear' this tile's image, or reset it to your chosen default",
                    onClick: async (event, options = {}) => {
                        let { tileID } = options;
                        // let tileID = parentElement.dataset.id;
                        await game.JTCS.imageUtils.manager.clearTile(tileID);
                    },
                    extraClass: "danger-text",
                    overflow: false,
                },

                // the overflow menu should be last
                toggleOverflowMenu: {
                    icon: "fas fa-ellipsis-v",
                    tooltipText: "show menu of extra options for this art tile",
                    overflow: false,
                    renderAlways: true,
                    onClick: async (event, options = {}) => {
                        let { app, tileID, parentLI } = options;
                        if (!tileID) tileID = parentLI.dataset.tileID;
                        let parentItemMissing = parentLI.dataset.missing ? true : false;

                        let actions = slideshowDefaultSettingsData.itemActions.click.actions;

                        let overflowActions = {};
                        for (let actionKey in actions) {
                            let { overflow, renderOnMissing, renderAlways } = actions[actionKey];
                            if (!renderOnMissing) renderOnMissing = false; //if render on missing is undefined, set it to false

                            let shouldRender = renderOnMissing === parentItemMissing; //fif the parent item's missing status and the button's conditional rendering status are equal

                            if (overflow && (shouldRender || renderAlways)) {
                                //if it's an action to renderon the overflow menu
                                overflowActions[actionKey] = actions[actionKey];
                            }
                        }
                        let context = {
                            propertyString: "itemActions.click.actions",
                            items: overflowActions,
                        };
                        let templateData = Popover.createTemplateData(parentLI, "item-menu", context);

                        let elementData = { ...Popover.defaultElementData };

                        console.log("Overflow menu targets", event.currentTarget, event.target);
                        let popover = await Popover.processPopoverData(
                            // event.currentTarget,
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
                renderTileConfig: {
                    text: "Render tile object config",
                    tooltipText: "Render the config for the tile object linked to this tile",
                    icon: "fas fa-cog",
                    overflow: true,
                    onClick: async (event, options = {}) => await extraActions.renderTileConfig(event, options),
                    renderOnMissing: false,
                },
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
