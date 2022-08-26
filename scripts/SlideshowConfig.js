"use strict";
import { log, MODULE_ID } from "./debug-mode.js";
import { JTCSSettingsApplication } from "./classes/JTCSSettingsApplication.js";
import { JTCSActions } from "./data/JTCS-Actions.js";

function createTemplateData(parentLI, partialName, context = {}) {
    let dataset = $(parentLI).data();
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
    updateTileData: async (event, options = {}) => {
        let clickedElement = $(event.currentTarget);

        let { name, value } = event.currentTarget;

        let { tileID, app, parentLI } = options;

        let action = clickedElement.data().action || clickedElement.data().changeAction;
        // let changeAction = clickedElement.data().changeAction;

        let { type } = $(parentLI).data();

        let isNewTile = false;
        let isBoundingTile = type === "frame";

        // console.log("updating tile data with these options", options, "this action", action, type);

        if (action.includes("createNewTileData")) {
            isNewTile = true;
            tileID = `unlinked${foundry.utils.randomID()}`;
            name = "displayName";
            value = `Untitled ${type} Tile`;
        } else {
            // if we're already a Slideshow tile, look for our ID
            tileID = clickedElement[0].closest(".tile-list-item, .popover").dataset.id;
            name = "displayName";
        }

        if (tileID) {
            let updateData = {
                id: tileID,
                [name]: value,
                ...(isNewTile ? { isBoundingTile: isBoundingTile } : {}),
            };
            await game.JTCS.tileUtils.updateSceneTileFlags(updateData, tileID);
            await app.renderWithData();
        }
    },
    deleteTileData: async (event, options = {}) => {
        let { app, tileID } = options;
        await game.JTCS.tileUtils.deleteSceneTileData(tileID);
        await app.renderWithData();
    },
};
const slideshowDefaultSettingsData = {
    globalActions: {
        click: {
            propertyString: "globalActions.click.actions",
            actions: {
                showURLShareDialog: {
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
                        await game.JTCS.tileUtils.updateTileDataID(tileID, selectedID);
                        if (app.rendered) {
                            await app.renderWithData();
                        }
                    },
                },
                setFrameTile: {
                    onChange: async (event, options) => await extraActions.updateTileData(event, options),
                },
                setDisplayName: {
                    onChange: async (event, options) => await extraActions.updateTileData(event, options),
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

                        let elementData = { ...defaultElementData };
                        elementData["popoverElement"].hideEvents.push({
                            eventName: "change",
                            selector: "input, input + label",
                            wrapperFunction: async (event) => {},
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
                        let { tileID, parentLI, app, html } = options;
                        let frameTileID = "";
                        if (parentLI) {
                            frameTileID = parentLI.dataset.frameId;
                            if (!tileID) {
                                tileID = parentLI.dataset.id;
                            }
                        }

                        let templateData = createTemplateData(parentLI, "input-with-error");

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
                    },
                    overflow: false,
                },
                toggleOverflowMenu: {
                    icon: "fas fa-ellipsis-v",
                    tooltipText: "show menu of extra options for this art tile",
                    overflow: false,
                    renderAlways: true,
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
                createNewGalleryTile: {
                    icon: "fas fa-plus",
                    tooltipText: `"Create a new" "<span>" this.type "</span>" "tile on the canvas in scene" 
								"<span>" @root.currentSceneName "</span>" 
							)`,
                    overflow: false,
                    renderOnMissing: true,
                    onClick: async (event, options = {}) => {
                        let { tileID, parentLI, app } = options;
                        let isFrameTile = parentLI.dataset.type === "frame";
                        await game.JTCS.tileUtils.createAndLinkSceneTile({
                            unlinkedDataID: tileID,
                            isFrameTile: isFrameTile,
                        });
                        await app.renderWithData();
                    },
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
    }

    async handleAction(event, actionType = "action") {
        event.preventDefault();
        let targetElement = $(event.currentTarget);
        //if our target element is a label, get the input before it instead
        targetElement.prop("nodeName") === "LABEL" && (targetElement = targetElement.prev());

        let action = targetElement.data()[actionType];
        let handlerPropertyString = "onClick";

        let parentLI = targetElement[0].closest(".tile-list-item, .popover");
        let tileID = parentLI?.dataset?.id;

        switch (actionType) {
            case "hoverAction":
                handlerPropertyString = "onHover";
                break;
            case "changeAction":
                handlerPropertyString = "onChange";
                break;
        }
        let actionData = getProperty(slideshowDefaultSettingsData, action);

        if (actionData && actionData.hasOwnProperty(handlerPropertyString)) {
            //call the event handler stored on this object
            let app = game.JTCSlideshowConfig;
            let options = {
                action: action,
                tileID: tileID,
                parentLI: parentLI,
                app: app,
                html: app.element,
            };

            actionData[handlerPropertyString](event, options);
        }
    }

    async handleHover(event) {
        let hoveredElement = $(event.currentTarget);
        let tag = hoveredElement.prop("nodeName");
        let hoverAction = hoveredElement.data().hoverAction;
        if (tag === "LABEL") {
            hoverAction = hoveredElement.prev().data().hoverAction;
        }
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

    // async validateInput(event, eventHandler, options = {}) {
    //     let { type, value } = event.currentTarget;
    //     if (type.includes("text") && value === "") {
    //         ui.notifications.error("Please enter a value");
    //     } else {
    //         await eventHandler(event, options);
    //     }
    // }
    // async updateTileItem(event, action) {
    //     event.preventDefault();
    //     let { value, name, checked, type } = event.currentTarget;
    //     let clickedElement = $(event.currentTarget);

    //     let parentLI = clickedElement[0].closest(".tile-list-item, .popover");
    //     let app = game.JTCSlideshowConfig;
    //     let html = app.element;
    //     let options = { app: app, html: html };
    //     if (parentLI) {
    //         //if it has a parent LI, it means it's a tile item
    //         let tileType = parentLI.dataset?.type;
    //         let tileID = parentLI.dataset?.id;

    //         let isNewTile = false;

    //         let isBoundingTile = tileType === "frame" ? true : false;
    //         options = { ...options, tileID: tileID, parentLI: parentLI };
    //     }

    //     let changeSettingsData = getProperty(slideshowDefaultSettingsData, action);

    //     if (changeSettingsData && changeSettingsData.hasOwnProperty("onChange")) {
    //         let app = game.JTCSlideshowConfig;
    //         let html = app.element;
    //         changeSettingsData.onChange(event, options);
    //         return;
    //     }
    // }

    async _handleButtonClick(event) {
        let clickedElement = $(event.currentTarget);
        event.stopPropagation();
        event.preventDefault();
        let action = clickedElement.data().action;

        //if we're clicking on a button within the list item, get the parent list item's id, else, get the list item's id
        let parentLI = clickedElement[0].closest(".tile-list-item, .popover");
        let tileID = parentLI?.dataset?.id;

        let settingsData = getProperty(slideshowDefaultSettingsData, action);

        if (settingsData && settingsData.hasOwnProperty("onClick")) {
            settingsData.onClick(event, {
                action: action,
                tileID: tileID,
                parentLI: parentLI,
                app: this,
                html: this.element,
            });
        }
    }

    async activateListeners(html) {
        super.activateListeners(html);
        await this.setUIColors(html);
        this._handleToggle(html);

        html.off("click").on("click", "[data-action]", (event) => this.handleAction(event));
        html.on("mouseover mouseout", "[data-hover-action], [data-hover-action] + label", (event) =>
            this.handleAction(event, "hoverAction")
        );
        html.on("change", "[data-change-action]", (event) => this.handleAction(event, "changeAction"));

        // html.off("click").on("click", "[data-action]", this._handleButtonClick.bind(this));
        html.on(
            "mouseenter mouseleave",
            `li:not([data-missing='true'], [data-flag='ignore-hover'])`,
            this._handleHover.bind(this)
        );
        // html.on("mouseover mouseout", "[data-hover-action], [data-hover-action] + label", this.handleHover.bind(this));

        // this._handleChange();
    }
    async _handleChange() {
        $("#slideshow-config :is(select, input[type='checkbox'], input[type='radio'], input[type='text'])").on(
            "change",
            async (event) => {
                let changedElement = $(event.currentTarget);

                let parentLI = changedElement[0].closest(".tile-list-item, .popover");
                let tileID = parentLI?.dataset?.id;

                let changeAction = changedElement.data().changeAction;
                let changeSettingsData = getProperty(slideshowDefaultSettingsData, changeAction);

                if (changeSettingsData && changeSettingsData.hasOwnProperty("onChange")) {
                    let app = game.JTCSlideshowConfig;
                    let html = app.element;
                    let options = {
                        app: app,
                        html: html,
                        tileID: tileID,
                        parentLI: parentLI,
                    };
                    changeSettingsData.onChange(event, options);
                }
            }
        );
    }
}

window.SlideshowConfig = SlideshowConfig;
