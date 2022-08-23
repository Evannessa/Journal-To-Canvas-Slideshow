"use strict";
import { log, MODULE_ID } from "./debug-mode.js";
import { JTCSSettingsApplication } from "./classes/JTCSSettingsApplication.js";
import { JTCSActions } from "./data/JTCS-Actions.js";

const slideshowDefaultSettingsData = {
    globalActions: {
        showURLShareDialog: {
            name: "showURLShareDialog",
            icon: "fas fa-external-link-alt",
            tooltipText: "Share a URL link with your players",
            onClick: async (event, options = {}) => {
                // let buttonActionCallback = async (html) => {
                //     let urlInput = html.find("input[name='urlInput']");
                //     let url = urlInput.val();
                //     let method = "window";
                //     if (url !== "") {
                //         await game.JTCS.imageUtils.manager.determineDisplayMethod({
                //             method: method,
                //             url: url,
                //         });
                //     }
                // };
                let wrappedActions = {};
                for (let actionName in JTCSActions.displayActions.actionName) {
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
                let settingsApp = new JTCSSettingsApplication().render(true);
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
                },
                linkTile: {
                    icon: "fas fa-link",
                    onClick: async (event, options = {}) => {
                        let { tileID, app, html } = options;
                        let buttonElement = event.currentTarget;
                        let position = buttonElement.getBoundingClientRect();
                        // -- RENDER THE POPOVER
                        let artTileDataArray = await game.JTCS.tileUtils.getSceneSlideshowTiles("", true);
                        let unlinkedTilesIDs = await game.JTCS.tileUtils.getUnlinkedTileIDs(artTileDataArray);
                        let templateData = {
                            passedPartial: "tile-link-partial",
                            passedPartialContext: {
                                artTileDataArray: artTileDataArray,
                                unlinkedTilesIDs: unlinkedTilesIDs,
                            },
                        };

                        let popover = await game.JTCS.utils.manager.createPopover(templateData, app, position);
                        popover.on("change", "[data-change-action]", (event) => {
                            let changeAction = event.currentTarget.dataset.changeAction;
                            let settingsData = getProperty(slideshowDefaultSettingsData, changeAction);
                            if (settingsData && settingsData.hasOwnProperty("onChange")) {
                                settingsData.onChange(event, {});
                            }
                        });

                        popover.on(
                            "mouseenter mouseleave",
                            "[data-hover-action], [data-hover-action] + label",
                            (event) => {
                                let targetElement = event.currentTarget;

                                //target the label as well in case we mouse over that
                                if (targetElement.tagName === "LABEL") {
                                    targetElement = targetElement.previousElementSibling;
                                }
                                let hoverAction = targetElement.dataset.hoverAction;
                                let hoverData = getProperty(slideshowDefaultSettingsData, hoverAction);
                                if (hoverData && hoverData.hasOwnProperty("onHover")) {
                                    hoverData.onHover(event, { targetElement: targetElement });
                                }
                            }
                        );
                    },
                    renderCondition: () => {}, //TODO: Only render when meets condition
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
        let hoverAction = hoveredElement.data().hoverAction;
        console.log(hoverAction, hoveredElement);
        let hoverData = getProperty(
            slideshowDefaultSettingsData,
            `individualTileHoverListeners.actions.${hoverAction}`
        );
        console.log(hoverAction, hoverData);
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

        let tileType = clickedElement[0].closest("li").dataset.type;
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
        // let name = clickedElement.data().displayName;
        let propertyString = event.currentTarget.name;
        console.log(propertyString);

        //if we're clicking on a button within the list item, get the parent list item's id, else, get the list item's id
        let tileID;
        if (clickedElement[0].closest("li")) {
            tileID = this.getIDFromListItem(clickedElement, ["BUTTON"]);
        }
        let settingsData = getProperty(slideshowDefaultSettingsData, propertyString);
        if (settingsData && settingsData.hasOwnProperty("onClick")) {
            settingsData.onClick(event, { tileID: tileID, app: this, html: this.element });
        }

        switch (action) {
            case "convert":
                this.convertToNewSystem();
                break;
            case "createSlideshowTile":
                let isFrameTile = false;
                if (type === "frame") isFrameTile = true;
                await game.JTCS.tileUtils.createAndLinkSceneTile({ unlinkedDataID: tileID, isFrameTile: isFrameTile });
                await this.renderWithData();
                break;
            // case "linkTile":
            //     //link this data to an unlinked tile in the scene
            //     await this.createTileLinkDialogue(tileID);
            //     break;
            case "renderTileConfig":
                await game.JTCS.tileUtils.renderTileConfig(tileID);
                break;
            case "shareURL":
                await this.createURLShareDialog();
                break;
            case "selectTile":
                await game.JTCS.tileUtils.selectTile(tileID);
                break;
            case "deleteTileData":
                await game.JTCS.tileUtils.deleteSceneTileData(tileID);
                await this.renderWithData();
                break;
            case "createNewTileData":
                await this.updateTileItem(event, action);
                await this.renderWithData();
                break;
            case "showModuleSettings":
                let settingsApp = new JTCSSettingsApplication().render(true);
                break;
        }
    }

    async activateListeners(html) {
        super.activateListeners(html);
        // this.setupActionObjects();
        await this.setUIColors(html);
        this._handleToggle(html);

        html.off("click").on("click", "[data-action]", this._handleButtonClick.bind(this));
        html.on(
            "mouseenter mouseleave",
            `li:not([data-missing='true'], [data-flag='ignore-hover'])`,
            this._handleHover.bind(this)
        );
        html.on("mouseover mouseout", "[data-hover-action]", this.handleHover.bind(this));
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
