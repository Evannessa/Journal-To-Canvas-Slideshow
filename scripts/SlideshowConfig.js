"use strict";
import { log, MODULE_ID } from "./debug-mode.js";
import { slideshowDefaultSettingsData } from "../data/JTCSSlideshowConfigData.js";

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
        if (actionType === "action") {
            console.log(actionType, event.target, " is being called");
            //TODO: this is a hacky solution for your issue. fIgure out a better way.
            // event.stopPropagation();
        }
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
        // this._handleToggle(html);

        html.off("click").on("click", "[data-action]", (event) => this.handleAction(event));
        html.off("mouseenter mouseleave").on(
            "mouseenter mouseleave",
            `[data-hover-action]:not([data-missing='true'], [data-flag='ignore-hover']), 
            [data-hover-action]:not([data-missing='true'], [data-flag='ignore-hover']) + label`,
            (event) => this.handleAction(event, "hoverAction")
        );
        // html.on("mouseover mouseout", "[data-title]", (event) => this.handleAction(event, "hoverAction"));
        html.off("change").on("change", "[data-change-action]", (event) => this.handleAction(event, "changeAction"));

        // html.off("click").on("click", "[data-action]", this._handleButtonClick.bind(this));
        // html.on(
        //     "mouseenter mouseleave",
        //     `li:not([data-missing='true'], [data-flag='ignore-hover'])`,
        //     this._handleHover.bind(this)
        // );
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
