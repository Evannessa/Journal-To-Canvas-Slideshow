"use strict";
import { log, MODULE_ID } from "./debug-mode.js";
import { JTCSSettingsApplication } from "./classes/JTCSSettingsApplication.js";
import { JTCSActions } from "./data/JTCS-Actions.js";

function createTemplateData(parentLI, partialName, context = {}) {
    let dataset = $(parentLI).data();
    console.log(dataset);
    return {
        passedPartial: partialName,
        dataset: dataset,
        passedPartialContext: context,
    };
}

let defaultElementData = {
    popoverElement: {
        target: null,
        hideEvents: [],
    },
    sourceElement: {
        target: null,
        hideEvents: [],
    },
    parentElement: {
        target: null,
        hideEvents: [],
    },
};

async function createTileItemPopover(event, templateData, options = {}, elementData = defaultElementData) {
    let { app, html } = options;
    let sourceElement = event.currentTarget;
    // -- RENDER THE POPOVER
    elementData.parentElement.target = html;
    elementData.sourceElement.target = sourceElement;

    let elementDataArray = Object.keys(elementData).map((key) => {
        let newData = elementData[key];
        newData.name = key;
        return newData;
    });

    let popover = await game.JTCS.utils.manager.createAndPositionPopover(templateData, elementDataArray);
    return popover;
}
const extraActions = {
    renderTileConfig: async (event, options = {}) => {
        let { tileID } = options;
        await game.JTCS.tileUtils.renderTileConfig(tileID);
    },
    selectTile: async (event, options = {}) => {
        let { tileID } = options;
        await game.JTCS.tileUtils.selectTile(tileID);
    },
    deleteTileData: async (event, options = {}) => {
        let { app, tileID } = options;
        await game.JTCS.tileUtils.deleteSceneTileData(tileID);
        await app.renderWithData();
    },
};
const slideshowDefaultSettingsData = {
    globalActions: {
        showURLShareDialog: {
            name: "showURLShareDialog",
            icon: "fas fa-external-link-alt",
            tooltipText: "Share a URL link with your players",
            onClick: async (event, options = {}) => {
                let wrappedActions = {};
                let { displayActions } = JTCSActions;
                for (let actionName in displayActions) {
                    wrappedActions[actionName] = displayActions[actionName];
                    //converting properties to fit the dialog's schema
                    wrappedActions[actionName].icon = `<i class='${displayActions[actionName].icon}'></i>`;
                    wrappedActions[actionName].label = actionName;
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
        },
        showModuleSettings: {
            icon: "fas fa-cog",
            tooltipText: "Open Journal-to-Canvas Slideshow Art Gallery Settings",
            onClick: (event, options = {}) => {
                if (!game.JTCSSettingsApp) {
                    game.JTCSSettingsApp = new JTCSSettingsApplication().render(true);
                }
            },
        },
    },
    itemActions: {
        change: {
            propertyString: "itemActions.change.actions",
            actions: {
                setLinkedTile: {
                    onChange: async (event, options = {}) => {
                        let { app, targetElement } = options;
                        if (!targetElement) targetElement = event.currentTarget;
                        if (!app) app = game.JTCSlideshowConfig;
                        let selectedID = targetElement.value;
                        // await game.JTCS.tileUtils.updateTileDataID(tileID, selectedID);
                        if (app.rendered) {
                            await app.renderWithData();
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
            },
        },
        click: {
            //for buttons
            propertyString: "itemActions.click.actions",
            actions: {
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
                showUnlinkedTiles: {
                    icon: "fas fa-link",
                    onClick: async (event, options = {}) => {
                        let { app, tileID, parentLI } = options;
                        let type = parentLI.dataset.type;

                        let frameTileID;
                        if (!frameTileID) frameTileID = parentLI.dataset.frameId;

                        let artTileDataArray = await game.JTCS.tileUtils.getSceneSlideshowTiles("", true);
                        let unlinkedTilesIDs = await game.JTCS.tileUtils.getUnlinkedTileIDs(artTileDataArray);
                        let context = {
                            artTileDataArray: artTileDataArray,
                            unlinkedTilesIDs: unlinkedTilesIDs,
                        };
                        let templateData = createTemplateData(parentLI, "tile-link-partial", context);

                        // let templateData = {
                        //     passedPartial: "tile-link-partial",
                        //     dataset: {
                        //         id: tileID,
                        //         type: type,
                        //     },
                        // };

                        let elementData = { ...defaultElementData };
                        elementData["popoverElement"].hideEvents.push({
                            eventName: "change",
                            selector: "input, input + label",
                            wrapperFunction: async (event) => {
                                console.log("Selected tile changed", event);
                            },
                        });
                        // -- RENDER THE POPOVER
                        let popover = await createTileItemPopover(event, templateData, options, elementData);
                        await app.activateListeners(app.element);
                        popover[0].querySelector("input").focus({ focusVisible: true });

                        return;
                    },
                    overflow: false,
                    renderOnMissing: true,
                },
                shareURLOnTile: {
                    icon: "fas fa-external-link-alt",
                    tooltipText: "Share image from a url on this tile",
                    // dataset: {
                    //     action: "shareURLOnTile",
                    // },
                    onClick: async (event, options = {}) => {
                        // console.log(event.currentTarget)
                        let { tileID, parentLI, app, html } = options;
                        let frameTileID = "";
                        if (parentLI) {
                            frameTileID = parentLI.dataset.frameId;
                            if (!tileID) {
                                tileID = parentLI.dataset.id;
                            }
                        }

                        let templateData = createTemplateData(parentLI, "input-with-error");

                        // let templateData = {
                        //     passedPartial: "input-with-error",
                        //     dataset: {
                        //         id: tileID,
                        //         "frame-id": frameTileID,
                        //         type: type,
                        //     },
                        //     passedPartialContext: {
                        //         // artTileDataArray: artTileDataArray,
                        //         // unlinkedTilesIDs: unlinkedTilesIDs,
                        //     },
                        // };

                        let elementData = { ...defaultElementData };

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

                        let popover = await createTileItemPopover(event, templateData, options, elementData);
                        popover[0].querySelector("input").focus({ focusVisible: true });
                        // popover.on("change", "input", async (event) => {
                        //     let url = event.currentTarget.value;
                        //     let valid = game.JTCS.utils.manager.validateInput(url, "image");
                        //     if (valid) {
                        //         await game.JTCS.imageUtils.manager.updateTileObjectTexture(
                        //             tileID,
                        //             frameTileID,
                        //             url,
                        //             "anyTile"
                        //         );
                        //         await game.JTCS.utils.manager.hideAndDeletePopover(popover);
                        //     } else {
                        //         ui.notifications.error("URL not an image");
                        //         //TODO: show error?
                        //     }
                        // });
                    },
                    overflow: false,
                },
                toggleOverflowMenu: {
                    icon: "fas fa-ellipsis-v",
                    tooltipText: "show menu of extra options for this art tile",
                    overflow: false,
                    onClick: async (event, options = {}) => {
                        let { app, tileID, parentLI } = options;
                        let frameTileID = parentLI.dataset.frameTileID;
                        if (!tileID) tileID = parentLI.dataset.tileID;
                        let type = parentLI.dataset.type;

                        let actions = slideshowDefaultSettingsData.itemActions.click.actions;
                        let overflowActions = {};
                        for (let actionKey in actions) {
                            if (actions[actionKey].overflow) {
                                overflowActions[actionKey] = actions[actionKey];
                                // overflowActions[actionKey].dataset = {};
                                // overflowActions[actionKey].dataset.id = tileID;
                                // overflowActions[actionKey].dataset["frame-id"] = frameTileID;
                            }
                        }
                        let context = {
                            propertyString: "itemActions.click.actions",
                            items: overflowActions,
                        };
                        let templateData = createTemplateData(parentLI, "item-menu", context);

                        // let templateData = {
                        //     passedPartial: "item-menu",
                        //     dataset: {
                        //         id: tileID,
                        //         "frame-id": frameTileID,
                        //         type: type,
                        //     },

                        // };
                        let elementData = { ...defaultElementData };
                        // elementData["popoverElement"].hideEvents.push({
                        //     eventName: "click",
                        //     selector: "[data-action]",
                        //     wrapperFunction: async (event) => {},
                        // });

                        let popover = await createTileItemPopover(event, templateData, options, elementData);

                        await app.activateListeners(app.element);
                        popover.focus({ focusVisible: true });
                    },
                },
                selectTile: {
                    text: "Select tile object",
                    tooltipText: "Select the tile object in this scene",
                    icon: "fas fa-vector-square",
                    overflow: true,
                    onClick: async (event, options = {}) => await extraActions.selectTile(event, options),
                },
                renderTileConfig: {
                    text: "Render tile object config",
                    tooltipText: "Render the config for the tile object linked to this tile",
                    icon: "fas fa-cog",
                    overflow: true,
                    onClick: async (event, options = {}) => await extraActions.renderTileConfig(event, options),
                },
                deleteTileData: {
                    icon: "fas fa-trash",
                    tooltipText: `delete this" this.type "tile data?" "<br/>" 
                                        "(this will not delete the tile object in the scene itself)`,

                    overflow: true,
                    extraClass: "danger-text",
                    onClick: async (event, options = {}) => extraActions.deleteTileData(event, options),
                },
            },
        },
    },
};

export class SlideshowConfig extends Application {
    constructor(data = {}) {
        // super({ renderData: { ...data } });
        super(data);
        this.data = data;
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["form"],
            popOut: true,
            resizable: true,
            template: "modules/journal-to-canvas-slideshow/templates/scene-tiles-config.hbs",
            id: "slideshow-config",
            title: "Slideshow Config",
            scrollY: ["ul"],
        });
    }

    //for saving tab layouts and such
    renderWithData() {
        this.render(true, this.data);
        // this.render(true, { renderData: this.data });
    }

    async createURLShareDialog() {
        let shareLocations = [{ name: "artScene" }];
    }

    async handleHover(event) {
        let hoveredElement = $(event.currentTarget);
        let tag = hoveredElement.prop("nodeName");
        let hoverAction = hoveredElement.data().hoverAction;
        console.log("Our tag is", tag);
        if (tag === "LABEL") {
            console.log(hoveredElement.prop("nodeName"), hoveredElement.prev().prop("nodeName"));
            hoverAction = hoveredElement.prev().data().hoverAction;
            console.log(hoverAction);
        }
        // let propertyString = $(event.currentTarget).data();
        console.log("Property string on hover is", hoverAction);
        let hoverData = getProperty(slideshowDefaultSettingsData, hoverAction);
        if (hoverData && hoverData.hasOwnProperty("onHover")) {
            hoverData.onHover(event, {});
        }
    }
    async _handleHover(event) {
        let isLeave = event.type === "mouseleave" ? true : false;
        // we want every hover over a tile to highlight the tiles it is linked to
        let hoveredElement = $(event.currentTarget);
        let type = hoveredElement.data().type;
        let id = hoveredElement.data().id;

        let otherListItems = [];
        let frameID = hoveredElement.data().frameId;
        if (type === "frame") frameID = id;

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
                    match = dataset.includes(id);
                }
                return match;
            });
        }
        if (!id) {
            return;
        }

        let tile = await game.JTCS.tileUtils.getTileObjectByID(id);
        if (isLeave) {
            hoveredElement.removeClass("accent border-accent");
            $(otherListItems).removeClass("accent border-accent");
            game.JTCS.indicatorUtils.hideTileIndicator(tile);
        } else {
            hoveredElement.addClass("accent border-accent");
            $(otherListItems).addClass("accent border-accent");
            game.JTCS.indicatorUtils.showTileIndicator(tile);
        }
    }

    async setTileLinks(artTileDataArray, frameTileDataArray) {
        //get ids
        artTileDataArray.forEach((artTileData) => {
            //if we have a linked bounding tile

            let linkedFrameID = artTileData.linkedBoundingTile;

            frameTileDataArray.forEach((frameTileData) => {
                if (frameTileData.id === linkedFrameID) {
                }
            });
        });
    }
    async showURLImage() {
        new Dialog({
            title: "Set url image",
            content: `
		  <form>
			<div class="form-group">
			  <label>Set url image</label>
			  <input type='text' name='inputField'></input>
			</div>
		  </form>`,
            buttons: {
                yes: {
                    icon: "<i class='fas fa-check'></i>",
                    label: `Show Image to Players`,
                },
            },
            default: "yes",
            close: (html) => {
                let result = html.find("input[name='inputField']");
                if (result.val() !== "") {
                    game.JTCS.dis;
                    determineLocation(null, result.val());
                }
            },
        }).render(true);
    }

    async setToggleButtonState(buttonElement, isActive = true) {
        buttonElement.classList.toggle("active");
    }

    async _handleToggle(html) {
        let details = html.find("details");

        let toggleClassListener = (event, element) => {
            if ($(element).attr("open")) {
                $(element).find(".toggle-icon i").removeClass("fa-plus-square").addClass("fa-minus-square");
            } else {
                $(element).find(".toggle-icon i").removeClass("fa-minus-square").addClass("fa-plus-square");
            }
        };

        let saveOpenState = (event) => {
            let element = event.currentTarget;
            console.log(element);
            console.log(element.open);
            let isOpen = element.open;
            let elementData = game.JTCSlideshowConfig.data[element.id];
            if (isOpen === undefined || isOpen === null) {
                return;
            }
            if (elementData) {
                elementData = { ...elementData, isOpen: isOpen };
            } else {
                game.JTCSlideshowConfig.data[element.id] = { isOpen: isOpen };
            }
        };

        details.each((index, element) => {
            element.addEventListener("toggle", (event) => {
                toggleClassListener(event, element);
            });

            if (element.classList.contains("collapsible-wrapper")) {
                element.addEventListener("toggle", (event) => {
                    saveOpenState(event, element);
                });
            }
        });
    }

    /**
     *
     * @param {JQueryObject} html - the html of the app (window content)
     */
    async setUIColors(html) {
        let colors = await game.JTCS.utils.getSettingValue("artGallerySettings", "indicatorColorData.colors");
        let { frameTileColor, artTileColor, unlinkedTileColor } = colors;
        // let root = document.documentElement;
        html[0].style.setProperty("--data-frame-color", frameTileColor);
        html[0].style.setProperty("--data-art-color", artTileColor);
        html[0].style.setProperty("--data-unlinked-color", unlinkedTileColor);
    }
    async getData() {
        //return data to template
        let ourScene = game.scenes.viewed;
        let shouldPromptConversion = false;

        let artTileDataArray = await game.JTCS.tileUtils.getSceneSlideshowTiles("art", true);
        let frameTileDataArray = await game.JTCS.tileUtils.getSceneSlideshowTiles("frame", true);

        let unlinkedTileIDs = await game.JTCS.tileUtils.getUnlinkedTileIDs([
            ...artTileDataArray,
            ...frameTileDataArray,
        ]);

        let allJournals = game.journal.contents;
        let artJournal = await game.JTCS.utils.getSettingValue(
            "artGallerySettings",
            "dedicatedDisplayData.journal.value"
        );

        let artJournalData = {
            options: allJournals,
            value: artJournal,
        };

        let allScenes = await game.JTCS.tileUtils.getAllScenesWithSlideshowData();
        let artScene = await game.JTCS.utils.getSettingValue("artGallerySettings", "dedicatedDisplayData.scene.value");

        let artSceneData = {
            options: allScenes,
            value: artScene,
        };

        return {
            shouldActivateDisplayScene: this.shouldActivateDisplayScene,
            artTiles: artTileDataArray,
            frameTiles: frameTileDataArray,
            unlinkedTiles: unlinkedTileIDs,
            currentSceneName: game.scenes.viewed.name,
            artSceneData: artSceneData,
            artJournalData: artJournalData,
            partials: game.JTCS.templates,
            settingsData: slideshowDefaultSettingsData,
            ...this.data,
        };
    }

    /**
     * Returns the data-id attribute's value from the parent LI if a child is clicked, or grabs it from the li itself if the li is clicked
     * @param {Element} clickedElement - the element that was clicked
     * @returns the ID from the "data-id" attribute stored on parent li
     */
    getIDFromListItem(clickedElement, childElementTypes = []) {
        let elementType = clickedElement.prop("tagName");
        //if the element's type is included in the array of types to look for
        let tileID = childElementTypes.includes(elementType)
            ? clickedElement[0].closest("li").dataset.id
            : clickedElement[0].dataset.id;
        return tileID;
    }

    async validateInput(event, eventHandler, options = {}) {
        let { type, value } = event.currentTarget;
        if (type.includes("text") && value === "") {
            ui.notifications.error("Please enter a value");
        } else {
            await eventHandler(event, options);
        }
    }
    async updateTileItem(event, action) {
        event.preventDefault();
        let { value, name, checked, type } = event.currentTarget;
        let clickedElement = $(event.currentTarget);
        //if its an input or a select

        let tileType = clickedElement[0].closest(".tile-list-item, .popover").dataset.type;
        let isNewTile = false;

        let tileID;
        let isBoundingTile = tileType === "frame" ? true : false;
        if (action === "createNewTileData") {
            isNewTile = true;
            tileID = `unlinked${foundry.utils.randomID()}`;
            name = "displayName";
            value = "Untitled Art Tile";
        } else {
            // if we're already a Slideshow tile, use this data
            tileID = game.JTCSlideshowConfig.getIDFromListItem(clickedElement, ["INPUT", "SELECT"]);
        }

        if (tileID) {
            let updateData = {
                id: tileID,
                [name]: value,
                ...(isNewTile ? { isBoundingTile: isBoundingTile } : {}),
            };
            await game.JTCS.tileUtils.updateSceneTileFlags(updateData, tileID);
            await game.JTCSlideshowConfig.renderWithData();
            // game.JTCSlideshowConfig.render(true, { renderData: this.data });
        } else {
            //tile is unlinked
            // await game.JTCS.getTile;
        }
    }

    async _handleButtonClick(event) {
        let clickedElement = $(event.currentTarget);
        event.stopPropagation();
        event.preventDefault();
        let action = clickedElement.data().action;
        let type = clickedElement.data().type;

        let propertyString = $(event.currentTarget).attr("name");

        //if we're clicking on a button within the list item, get the parent list item's id, else, get the list item's id
        let tileID;
        let parentLI = clickedElement[0].closest(".tile-list-item");
        console.log("Trying to find parent LI from", clickedElement[0]);
        if (!parentLI) {
            parentLI = clickedElement[0].closest(".popover");
        }
        console.log("Parent list item is", parentLI);
        if (parentLI) {
            tileID = parentLI.dataset.id;
        }
        let settingsData = getProperty(slideshowDefaultSettingsData, propertyString);
        if (settingsData && settingsData.hasOwnProperty("onClick")) {
            settingsData.onClick(event, { tileID: tileID, parentLI: parentLI, app: this, html: this.element });
        }

        switch (action) {
            // case "convert":
            //     this.convertToNewSystem();
            //     break;
            case "createSlideshowTile":
                let isFrameTile = false;
                if (type === "frame") isFrameTile = true;
                await game.JTCS.tileUtils.createAndLinkSceneTile({ unlinkedDataID: tileID, isFrameTile: isFrameTile });
                await this.renderWithData();
                break;
            // case "renderTileConfig":
            //     await game.JTCS.tileUtils.renderTileConfig(tileID);
            //     break;
            // case "shareURL":
            //     await this.createURLShareDialog();
            //     break;
            // case "selectTile":
            //     await game.JTCS.tileUtils.selectTile(tileID);
            //     break;
            case "deleteTileData":
                await game.JTCS.tileUtils.deleteSceneTileData(tileID);
                await this.renderWithData();
                break;
            case "createNewTileData":
                await this.updateTileItem(event, action);
                await this.renderWithData();
                break;
            // case "showModuleSettings":
            //     let settingsApp = new JTCSSettingsApplication().render(true);
            //     break;
        }
    }

    async activateListeners(html) {
        super.activateListeners(html);
        // this.setupActionObjects();
        await this.setUIColors(html);
        this._handleToggle(html);

        // html.on("click", "[data-action]", this._handleButtonClick.bind(this));
        html.off("click").on("click", "[data-action]", this._handleButtonClick.bind(this));
        html.on(
            "mouseenter mouseleave",
            `li:not([data-missing='true'], [data-flag='ignore-hover'])`,
            this._handleHover.bind(this)
        );
        html.on("mouseover mouseout", "[data-hover-action], [data-hover-action] + label", this.handleHover.bind(this));
        // let changeSelectorString =
        // ".tile-list-item :is(select, input[type='checkbox'], input[type='radio'], input[type='text']";
        // html.on("change", changeSelectorString, this._handleChange().bind(this));
        this._handleChange();
    }
    async _handleChange() {
        let app = game.JTCSlideshowConfig;
        $("#slideshow-config :is(select, input[type='checkbox'], input[type='radio'], input[type='text'])").on(
            "change",
            async (event) => {
                await app.validateInput(event, async (event) => {
                    let clickedElement = $(event.currentTarget);
                    // let hoverAction = clickedElement.data().hoverAction;
                    let action = clickedElement.data().action;
                    let value = clickedElement.val();

                    if (action) {
                        switch (action) {
                            case "setArtScene":
                                await game.JTCS.utils.setSettingValue(
                                    "artGallerySettings",
                                    value,
                                    "dedicatedDisplayData.scene.value"
                                );
                                await game.JTCSlideshowConfig.renderWithData();
                                break;
                            case "setArtJournal":
                                await game.JTCS.utils.setSettingValue(
                                    "artGallerySettings",
                                    value,
                                    "dedicatedDisplayData.journal.value"
                                );
                                await game.JTCSlideshowConfig.renderWithData();
                                break;
                            default:
                                console.error("Action didn't match any of these options", action);
                                break;
                        }
                    } else {
                        await game.JTCSlideshowConfig.updateTileItem(event, action);
                    }
                });
            }
        );
    }
}

window.SlideshowConfig = SlideshowConfig;
