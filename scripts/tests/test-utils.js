"use strict";
import { ArtTileManager } from "../classes/ArtTileManager.js";
import { HelperFunctions } from "../classes/HelperFunctions.js";
import { ImageDisplayManager } from "../classes/ImageDisplayManager.js";

export class TestUtils {
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
                // metaKey: true, // these are here for example's sake.
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
    static async getTileObject(tileID) {
        let tileObject = await ArtTileManager.getTileObjectByID(tileID);
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
     * @returns the Object representing the computed styles, or a property within
     */
    static returnComputedStyles(element, selector, property = "") {
        if (element.jquery) {
            element = element[0];
        }
        let selectedElement = element.querySelector(selector);
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

    static async duplicateTestScene(sourceScene) {
        let dupedSceneData = sourceScene.clone({
            name: "Test Scene",
        });
        let scene = await Scene.create(dupedSceneData);
        await scene.activate();
        await scene.view();
        return scene;
    }
    static async initializeScene() {
        let sourceScene = game.scenes.getName("Display");
        await sourceScene.view();
        return sourceScene;
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
