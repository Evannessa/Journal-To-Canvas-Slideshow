"use strict";
import { ArtTileManager } from "../classes/ArtTileManager.js";
import { HelperFunctions } from "../classes/HelperFunctions.js";
import { ImageDisplayManager } from "../classes/ImageDisplayManager.js";

export class TestUtils {
    /**
     * Dispatch a simulated event, for when the simple element.click() won't do
     * @param {HTMLElement} element - the element we're toggling
     * @param {*} eventInterface - the interface such as MouseEvent, ChangeEvent, KeyboardEvent
     * @param {String} eventName - the name of the event, such as "mouseenter", "change", "keydown"
     * @param {Object} options - object for extra options to pass to the event
     * @param {Boolean} options.bubbles - whether the event bubbles
     * @param {Boolean} options.ctrlKey - whether we should consider the ctrl key pressed or not
     * @example
     *
     */
    static dispatchEvent(
        element,
        eventInterface,
        eventName,
        options = {
            bubbles: true,
            ctrlKey: false,
        }
    ) {
        element.dispatchEvent(new eventInterface(eventName, options));
    }
    static dispatchMouseEnter(element) {
        element.dispatchEvent(
            new MouseEvent("mouseenter", {
                bubbles: true,
            })
        );
    }

    /**
     * Simulate keypress
     * @param {*} element
     */
    static dispatchKeypress(element, keyCode) {
        element.dispatchEvent(
            new KeyboardEvent("keydown", { key: keyCode, bubbles: true })
        );
    }

    /**
     * Simulate clicks, especially those with Ctrl or other keys pressed
     * @param {HTMLElement} element
     */
    static dispatchMouseDown(element) {
        element.dispatchEvent(
            new MouseEvent("click", {
                ctrlKey: true, // if you aren't going to use them.
                bubbles: true,
                metaKey: true, // these are here for example's sake.
            })
        );
    }
    /**
     * Simulate a "change" event on an element
     * @param {HTMLElement} element - the element we're simulatnig an event uppon
     */
    static dispatchChange(element) {
        // element.fireEvent("onchange");
        const e = new Event("change", { bubbles: true });
        element.dispatchEvent(e);
        // element.dispatchEvent("onchange");
    }
    static async getTileObject(tileID, sceneID = "") {
        let tileObject = await ArtTileManager.getTileObjectByID(tileID, sceneID);
        return tileObject;
    }
    static async getDocData(document, property = "") {
        let data = game.version >= 10 ? document : document.data;
        if (property) {
            return foundry.utils.getProperty(data, property);
        } else {
            return data;
        }
    }
    static async resizeTile(tileDoc, scene) {
        //give it random dimensions bigger than scene
        let width = (await TestUtils.getDocData(scene, "width")) + 30;
        let height = (await TestUtils.getDocData(scene, "height")) + 30;
        let updateData = {
            _id: tileDoc.id,
            width,
            height,
        };
        await scene.updateEmbeddedDocuments("Tile", [updateData]);
    }

    /**
     * change the tile's image to a test image
     */
    static async changeTileImage(tileID, url = "") {
        if (!url)
            url = "/modules/journal-to-canvas-slideshow/demo-images/pd19-20049_1.webp";
        await ImageDisplayManager.updateTileObjectTexture(tileID, "", url, "anyScene");
    }
    static async getArtGallerySettings(nestedPropertyString = "") {
        let settings = await HelperFunctions.getSettingValue(
            "artGallerySettings",
            nestedPropertyString
        );
        return settings;
    }

    /**
     * returns the "Computed Styles" Object or a property within if specified
     * @param {JQuery or HTMLElement} element - the element whose styles we're getting
     * @param {String} selector  - the selector of the element
     * @param {String} property  - the style property we want to return
     * @returns the Object representing the computed styles, or a property within
     */
    static returnComputedStyles(element, selector, property = "") {
        if (element.jquery) {
            element = element[0];
        }
        let selectedElement = element;
        if (selector) selectedElement = element.querySelector(selector);
        if (!property) return getComputedStyle(selectedElement);
        else return getComputedStyle(selectedElement).getPropertyValue(property);
    }

    static returnClassListAsArray(element, selector) {
        if (element.jquery) {
            element = element[0];
        }
        return Array.from(element.querySelector(selector).classList);
    }
    static getDocIdFromApp(app) {
        return app.document.id;
    }

    /**
     * We want to test each of the qualifications for if a frame tile
     * is properly linked to an art tile here
     *
     * @param {Object} frameTile - the frame tile
     * @param {Object} artTile - the art tile
     */
    static async testFitToFrame(frameTileID, artTileID) {
        const TU = TestUtils;

        let artTileDoc = await TU.getTileObject(artTileID);
        let frameDoc = await TU.getTileObject(frameTileID);
        //TODO - test if the art tile fits within the frame (tile or scene)
        let areas = await TU.getAreasOfDocs(frameDoc, artTileDoc);
        return areas;

        //TODO - test if the Config UI Updates to show that this art tile now has the frame tile as its child
    }

    static async duplicateTestScene(sourceScene) {
        // let dupedSceneData;
        let dupedSceneData = sourceScene.clone({ name: "Test Scene" });
        if (game.version < 10) {
            dupedSceneData = {
                ...foundry.utils.duplicate(sourceScene),
                _id: foundry.utils.randomID(),
                name: "Test Scene",
            };
        }

        let scene = await Scene.create(dupedSceneData);
        await scene.activate();
        await scene.view();
        return scene;
    }
    static async initializeScene(name = "Display") {
        let sourceScene = game.scenes.getName(name);
        await sourceScene.view();
        return sourceScene;
    }

    /**
     * Get the auto-view or auto-activate settings of the dedicatedDisplayData property
     * @param {String} sceneOrJournal - whether we want to access the scene or the journal sub-object
     * @param {String} viewOrActivate - whether we want to get the view or activate property
     */
    static async getAutoViewOrActivate(
        sceneOrJournal = "scene",
        viewOrActivate = "view"
    ) {
        const key = `dedicatedDisplayData[${sceneOrJournal}].auto${viewOrActivate}`;
        const current = await HelperFunctions.getSettingValue(`artGallerySettings`, key);
        return { key, current };
    }
    /**
     * Toggle the auto-view or auto-activate settings of the dedicatedDisplayData property
     * @param {String} sceneOrJournal - whether we want to access the scene or the journal sub-object
     * @param {String} viewOrActivate - whether we want to toggle the view or activate property
     */
    static async toggleAutoViewOrActivate(...args) {
        let { key, current } = await TestUtils.getAutoViewOrActivate(...args); //(sceneOrJournal, viewOrActivate)
        // const key = `dedicatedDisplayData[${sceneOrJournal}].auto${viewOrActivate}`;
        // const current = await HelperFunctions.getSettingValue(`artGallerySettings`, key);
        await HelperFunctions.setSettingValue("artGallerySettings", key, !current);
    }

    static async clickGlobalButton(configElement, actionName) {
        configElement[0]
            .querySelector(`[data-action='globalActions.click.actions.${actionName}']`)
            .click();
        await quench.utils.pause(900);
    }

    /**
     * @description - renders the Scene Config
     */
    static async renderConfig() {
        let configApp = new SlideshowConfig();
        await configApp._render(true);
        let configElement = configApp.element;
        return { configApp, configElement };
    }

    static async getDefaultImageSrc(type = "art") {
        let defaultImageSrc = await TestUtils.getArtGallerySettings(
            `defaultTileImages.paths.${type}TilePath`
        );
        return defaultImageSrc;
    }

    static async clickActionButton(actionName, element, options = { quench }) {
        const actionQueryString = combine(actionName);
        await clickButton(element, actionQueryString, quench);
    }

    /**
     * click a button, optionally one with a data-action attribute
     * @param {HTMLElement} element - the element to click
     * @param {Selector} selector - the selector of the button we want to find
     * @param {Object} options - options object
     * @param {Object} options.quench - the quench thing to pause the button
     * @param {String} options.actionName - the individual action name
     * @param {String} options.parentPath - the parent path to find the options' name
     */
    static async clickButton(element, selector, options) {
        const { quench, actionName, parentPath } = options;
        let ourButton = element.querySelector(selector);
        ourButton.click();
        await quench.utils.pause(900);
    }
    static getChildElements(element, selector, multiple = false) {
        if (element.jquery) {
            element = element[0];
        }
        if (multiple) {
            return Array.from(element.querySelectorAll(selector));
        } else {
            return element.querySelector(selector);
        }
    }
    static getAppFromWindow(type, searchText = "") {
        let windows = Object.values(ui.windows);
        function predicate(w) {
            let allTrue = false;
            if (w instanceof type) {
                if (!searchText) {
                    allTrue = true;
                } else {
                    if (w.element && w.element.text().includes(searchText))
                        allTrue = true;
                }
                return allTrue;
            }
        }
        return Object.values(ui.windows).filter(predicate)[0];
    }
    static checkAppElementForId(app, id) {
        let elementId = app.element?.attr("id");
        if (!app.element || elementId != id) {
            return false;
        } else {
            return true;
        }
    }

    static async deleteTestScene(scene) {
        let dupedSceneId = scene.id;
        await Scene.deleteDocuments([dupedSceneId]);
    }
    static async getDimensions(doc) {
        let width = await TestUtils.getDocData(doc, "width");
        let height = await TestUtils.getDocData(doc, "height");
        return {
            width,
            height,
        };
    }
    static async getAreasOfDocs(frameDoc, artTileDoc) {
        const frameDimensions = await TestUtils.getDimensions(frameDoc);
        const frameArea = frameDimensions.width * frameDimensions.height;

        const artDimensions = await TestUtils.getDimensions(artTileDoc);
        const artArea = artDimensions.width * artDimensions.height;
        return { artArea, frameArea };
    }
}
