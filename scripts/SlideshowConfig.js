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

    async handleAction(event, actionType = "action", html) {
        event.preventDefault();
        if (event.delegateTarget)
            if (actionType === "action") {
                console.log(event.delegateTarget, html, "handlign click");
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

    async activateListeners(html) {
        // super.activateListeners(html);
        html = $(html[0].closest(".window-app"));
        await this.setUIColors(html);
        // this._handleToggle(html);

        html.off("click").on("click", "[data-action]", async (event) => await this.handleAction(event, "action", html));
        html.off("mouseenter mouseleave").on(
            "mouseenter mouseleave",
            `[data-hover-action]:not([data-missing='true'], [data-flag='ignore-hover']), 
            [data-hover-action]:not([data-missing='true'], [data-flag='ignore-hover']) + label`,
            async (event) => await this.handleAction(event, "hoverAction")
        );
        html.off("mouseenter mouseleave").on(
            "mouseenter mouseleave",
            `[data-tooltip]`,
            async (event) => await Popover.generateTooltip(event, html, ".popover, .tile-list-item")
        );
        // html.on("mouseover mouseout", "[data-title]", (event) => this.handleAction(event, "hoverAction"));
        html.off("change").on(
            "change",
            "[data-change-action]",
            async (event) => await this.handleAction(event, "changeAction")
        );
    }
}

window.SlideshowConfig = SlideshowConfig;
