"use strict";
import { log, MODULE_ID } from "./debug-mode.js";
import { slideshowDefaultSettingsData } from "./data/SlideshowConfigActions.js";
import { Popover } from "./classes/PopoverGenerator.js";
import { HelperFunctions } from "./classes/HelperFunctions.js";

export class SlideshowConfig extends Application {
    constructor(data = {}) {
        super();
        this.data = data;
        this.element.find(".window-content").attr("data-fade-all");
    }

    /**
     * @override
     */
    async _render(force, options = {}) {
        console.log("Rendering something?");

        return super._render(force, options);
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["form"],
            popOut: true,
            resizable: true,
            height: 500,
            template:
                "modules/journal-to-canvas-slideshow/templates/scene-tiles-config.hbs",
            id: "slideshow-config",
            title: "Scene Gallery Config",
            scrollY: ["ul"],
        });
    }

    //for saving tab layouts and such
    renderWithData() {
        this.render(true, this.data);
    }
    hideButtons(html) {
        Array.from(
            html.querySelectorAll(".tile-list-item .actions .icon-button")
        ).forEach((btn) => {
            btn = $(btn);
            let data = btn.data();
            let parentData = btn.closest(".tile-list-item").data();
            let type = parentData.type;
            let action = data.action.split(".").pop();
            let itemActionsObject =
                slideshowDefaultSettingsData.itemActions.click.actions;
            let filteredActionKeys = [];
            Object.keys(itemActionsObject).forEach((itemAction) => {
                if (getProperty(itemActionsObject, itemAction).artTileOnly) {
                    filteredActionKeys.push(itemAction);
                }
            });
            filteredActionKeys.forEach((itemAction) => {
                if (type === "frame" && itemAction === action) {
                    btn.css({ display: "none" });
                }
            });
        });
    }
    /**
     * Handles all types of actions (click, hover, etc.) and finds their relevant functions
     * @param {Event} event - the passed in event that triggered this
     * @param {String} actionType - the type of action "action, hover action, changeAction, etc"
     */
    async handleAction(event, actionType = "action") {
        event.preventDefault();

        let targetElement = $(event.currentTarget);
        //if our target element is a label, get the input before it instead
        targetElement.prop("nodeName") === "LABEL" &&
            (targetElement = targetElement.prev());

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

    async getData() {
        //return data to template

        let artTileDataArray = await game.JTCS.tileUtils.getSceneSlideshowTiles(
            "art",
            true
        );
        let frameTileDataArray = await game.JTCS.tileUtils.getSceneSlideshowTiles(
            "frame",
            true
        );

        let unlinkedTileIDs = await game.JTCS.tileUtils.getUnlinkedTileIDs([
            ...artTileDataArray,
            ...frameTileDataArray,
        ]);
        let areConfigInstructionsVisible = await HelperFunctions.getSettingValue(
            "areConfigInstructionsVisible"
        );

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
        let artScene = await game.JTCS.utils.getSettingValue(
            "artGallerySettings",
            "dedicatedDisplayData.scene.value"
        );

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
            areConfigInstructionsVisible,
            settingsData: slideshowDefaultSettingsData,
            ...this.data,
        };
    }

    async activateListeners(html) {
        // super.activateListeners(html);
        html = $(html[0].closest(".window-app"));
        this.hideButtons(html[0]);
        html.find(".window-content").attr("data-fade-all", true);
        // await this.setUIColors(html);
        // this._handleToggle(html);

        html.off("click").on(
            "click",
            "[data-action]",
            async (event) => await this.handleAction(event, "action", html)
        );

        let hoverEventString = "mouseenter mouseleave";
        let hoverActionSelectorString = `[data-hover-action], 
            [data-hover-action] + label`;

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
