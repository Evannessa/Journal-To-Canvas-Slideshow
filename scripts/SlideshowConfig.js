"use strict";
import { log, MODULE_ID } from "./debug-mode.js";
import { slideshowDefaultSettingsData } from "./data/ArtGalleryConfigData.js";
import { Popover } from "./classes/PopoverGenerator.js";
export class SlideshowConfig extends Application {
    constructor(data = {}) {
        // super({ renderData: { ...data } });
        // super(data);
        super();
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

    /**
     * Handles all types of actions (click, hover, etc.) and finds their relevant functions
     * @param {Event} event - the passed in event that triggered this
     * @param {String} actionType - the type of action "action, hover action, changeAction, etc"
     */
    async handleAction(event, actionType = "action") {
        event.preventDefault();

        if (actionType === "action") {
            console.log("handling " + actionType, event.target, event.currentTarget);
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

        let defaultArtTileID = await game.JTCS.tileUtils.manager.getDefaultArtTileID();
        let artSceneData = {
            options: allScenes,
            value: artScene,
        };

        return {
            shouldActivateDisplayScene: this.shouldActivateDisplayScene,
            artTiles: artTileDataArray,
            defaultArtTileID,
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

    async activateListeners(html) {
        // super.activateListeners(html);
        html = $(html[0].closest(".window-app"));
        await this.setUIColors(html);
        // this._handleToggle(html);

        html.off("click").on("click", "[data-action]", async (event) => await this.handleAction(event, "action", html));

        let hoverEventString = "mouseenter mouseleave";
        let hoverActionSelectorString = `[data-hover-action]:not([data-missing='true'], [data-flag='ignore-hover']), 
            [data-hover-action]:not([data-missing='true'], [data-flag='ignore-hover']) + label`;

        html.off(hoverEventString, hoverActionSelectorString).on(
            hoverEventString,
            hoverActionSelectorString,
            async (event) => await this.handleAction(event, "hoverAction")
        );

        // let tooltipActionSelectorString = "[data-tooltip]";
        // html.off(hoverEventString, tooltipActionSelectorString).on(
        //     hoverEventString,
        //     tooltipActionSelectorString,
        //     async (event) => await Popover.generateTooltip(event, html, ".popover, .tile-list-item", "tooltip")
        // );

        html.off("change").on(
            "change",
            "[data-change-action]",
            async (event) => await this.handleAction(event, "changeAction")
        );
    }
}

window.SlideshowConfig = SlideshowConfig;
