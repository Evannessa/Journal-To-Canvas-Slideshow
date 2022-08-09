"use strict";
import { convertToNewSystem } from "./HooksAndFlags.js";
import { log, MODULE_ID } from "./debug-mode.js";

const templates = [
    `modules/journal-to-canvas-slideshow/templates/tile-list-item.hbs`,
    "modules/journal-to-canvas-slideshow/templates/tooltip.hbs",
    "modules/journal-to-canvas-slideshow/templates/control-button.hbs",
];

Hooks.on("renderSlideshowConfig", (app) => {
    game.JTCSlideshowConfig = app;
    // console.log(app);
});
Hooks.on("journalToCanvasSlideshowReady", async (api) => {
    game.JTCS = api;
});

Hooks.on("init", () => {
    loadTemplates(templates);
});
Hooks.on("createTile", async (tileDoc) => {
    let tileID = tileDoc.id;
    let sceneTiles = await game.JTCS.getSceneSlideshowTiles("", true);
    let foundTileData = await game.JTCS.getTileDataFromFlag(tileID, sceneTiles);
    await game.JTCS.setUpIndicators(foundTileData, tileDoc);
});

Hooks.on("canvasReady", async (canvas) => {
    const isDebugging = game.modules.get("_dev-mode")?.api?.getPackageDebugValue(MODULE_ID);
    //re-render the tile config
    if (game.JTCSlideshowConfig && game.user.isGM && isDebugging) {
        game.JTCSlideshowConfig.render(true);
    }

    //get tile data from scene flags
    let ourAPI = game.modules.get("journal-to-canvas-slideshow")?.api;

    let artTileDataArray = await ourAPI.getSceneSlideshowTiles("", true);

    game.scenes.viewed.tiles.forEach((tileDoc) => {
        let foundTileData = artTileDataArray.find((tileData) => tileData.id === tileDoc.id);

        game.JTCS.setUpIndicators(foundTileData, tileDoc);
        // let type = "unlinked";
        // if(foundTileData){
        // 	type = foundTileData.isBoundingTile ? "frame" : "art"
        // }
        // //get tile data that matches the TileDocument in the scene
        // setUpIndicators(tileDoc, type)
        // if (foundTileData) {
        //     let type = foundTileData.isBoundingTile ? "frame" : "art";
        //     ourAPI.createTileIndicator(tileDoc, type);
        //     ourAPI.hideTileIndicator(tileDoc, type);
        // } else {
        //     let type = "unlinked";
        //     ourAPI.createTileIndicator(tileDoc, type);
        //     ourAPI.hideTileIndicator(tileDoc, type);
        // }
    });
});

export class SlideshowConfig extends FormApplication {
    constructor(data) {
        super();
        this.data = data;
        this.DTC = game.modules.get("journal-to-canvas-slideshow")?.api;
    }
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["form"],
            popOut: true,
            template: "modules/journal-to-canvas-slideshow/templates/scene-tiles-config.hbs",
            id: "slideshow-config",
            title: "Slideshow Config",
        });
    }

    async _handleHover(event) {
        let isLeave = event.type === "mouseleave" ? true : false;
        let ourAPI = game.modules.get("journal-to-canvas-slideshow")?.api;
        // we want every hover over a tile to highlight the tiles it is linked to
        let hoveredElement = $(event.currentTarget);
        let type = hoveredElement.data().type;
        let id = hoveredElement.data().id;
        let frameId = hoveredElement.data().frameId;

        let otherListItems = Array.from(hoveredElement[0].closest(".tilesInScene").querySelectorAll("li")).filter(
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

        otherListItems = otherListItems.filter((element) => {
            let dataset = Object.values({ ...element.dataset }).join(" ");
            let match = false;
            if (type === "art") {
                //for art tiles, we're looking for frameTiles in the list that match the frame id
                match = dataset.includes(frameId);
            } else if (type === "frame") {
                //for frame tiles, we're looking for art tiles in the list that have our id
                match = dataset.includes(id);
            }
            return match;
        });

        let tile = await ourAPI.getTileByID(id);
        if (isLeave) {
            hoveredElement.removeClass("accent");
            $(otherListItems).removeClass("accent");
            ourAPI.hideTileIndicator(tile);
        } else {
            hoveredElement.addClass("accent");
            $(otherListItems).addClass("accent");
            ourAPI.showTileIndicator(tile);
        }
    }

    async getTileLinks() {}

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
    async checkIfTileExistsInScene(tileID, tileData) {
        let tile = await game.modules.get("journal-to-canvas-slideshow")?.api.getTileByID(tileID);
        if (!tile) {
            tileData.missing = true;
        }
        return tileData;
    }

    async getData() {
        //return data to template
        let ourScene = game.scenes.viewed;
        let shouldPromptConversion = false;

        let artTileDataArray = await game.JTCS.getSceneSlideshowTiles("art", true);
        let frameTileDataArray = await game.JTCS.getSceneSlideshowTiles("frame", true);

        let unlinkedTileIDs = await game.JTCS.getUnlinkedTileIDs([...artTileDataArray, ...frameTileDataArray]);
        console.warn("Our unlinked tiles", unlinkedTileIDs);

        let oldBoundingTile = await findBoundingTile(ourScene);
        let oldDisplayTile = await findDisplayTile(ourScene);
        if (oldBoundingTile || oldDisplayTile) {
            shouldPromptConversion = true;
        }
        return {
            shouldActivateDisplayScene: this.shouldActivateDisplayScene,
            promptConversion: shouldPromptConversion,
            artTiles: artTileDataArray,
            frameTiles: frameTileDataArray,
            unlinkedTiles: unlinkedTileIDs,
            currentSceneName: game.scenes.viewed.name,
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
        console.log(childElementTypes, elementType, childElementTypes.includes(elementType));
        let tileID = childElementTypes.includes(elementType)
            ? clickedElement[0].parentNode.dataset.id
            : clickedElement[0].dataset.id;
        return tileID;
    }

    async _handleButtonClick(event) {
        event.stopPropagation();
        event.preventDefault();
        let clickedElement = $(event.currentTarget);
        let action = clickedElement.data().action;

        //if we're clicking on a button within the list item, get the parent list item's id, else, get the list item's id
        let tileID = this.getIDFromListItem(clickedElement, ["BUTTON"]);
        // let tileID = elementType === "BUTTON" ? clickedElement[0].parentNode.dataset.id : clickedElement[0].dataset.id;

        switch (action) {
            case "convert":
                convertToNewSystem();
                break;
            case "createDisplayTile":
                game.JTCS.createDisplayTile();
                this.render(true);
                break;
            case "createFrameTile":
                game.JTCS.createFrameTile();
                this.render(true);
                break;
            case "renderTileConfig":
                await game.JTCS.renderTileConfig(tileID);
                break;
            case "selectTile":
                await game.JTCS.selectTile(tileID);
                break;
            case "deleteTileData":
                await game.JTCS.deleteSceneTileData(tileID);
                this.render(true);
                break;
            case "add":
                //we can create a new tile, or connect it to a tile that already exists
                // await game.JTCS.deleteSceneTileData(tileID);
                // this.render(true);
                break;
        }
    }

    /**
     * display a mini form in place of the add button
     */
    async displayMiniConfigForm() {}

    activateListeners(html) {
        super.activateListeners(html);
        html.off("click").on("click", "[data-action]", this._handleButtonClick.bind(this));
        html.on(
            "mouseenter mouseleave",
            `li:not([data-missing='true'], [data-flag='ignore-hover'])`,
            this._handleHover.bind(this)
        );
        this.handleChange();
    }
    handleChange() {
        $("select:not([name='unlinkedTiles']), input[type='checkbox'], input[type='radio'], input[type='text']").on(
            "change",
            async function (event) {
                let { value, name, checked, type } = event.currentTarget;
                let clickedElement = $(event.currentTarget);

                if (value === "") {
                    //don't submit the input if there's no value
                    //TODO: Put an error message here

                    return;
                }
                // we're creating a new tile
                //get id of selected tile
                let tileID = "";
                if (name === "newTileName") {
                    let selectedUnlinkedTileID = clickedElement[0].nextElementSibling.value;
                    let foundInScene = await game.JTCS.getTileByID(selectedUnlinkedTileID);

                    //this will return the tile document if it exists in the scene
                    if (foundInScene) {
                        name = "displayName"; //set the name here to the display name so we can use the already-created updateData object

                        tileID = selectedUnlinkedTileID; // set the tile id to the selected ID value from the unlinked tiles
                    }
                } else {
                    // if we're already a Slideshow tile, use this data
                    tileID = game.JTCSlideshowConfig.getIDFromListItem(clickedElement, ["INPUT", "SELECT"]);
                }

                if (tileID) {
                    let updateData = {
                        id: tileID,
                        [name]: value,
                    };
                    await game.JTCS.updateSceneTileFlags(updateData, tileID);
                    game.JTCSlideshowConfig.render(true);
                } else {
                    //tile is unlinked
                    await game.JTCS.getTile;
                }
            }
        );
    }

    async _updateObject(event, formData) {}
}

window.SlideshowConfig = SlideshowConfig;
export function findBoundingTile(ourScene) {
    let tiles = ourScene.tiles.contents;
    let boundingTile;
    for (let tile of tiles) {
        let hasFlag = tile.getFlag("journal-to-canvas-slideshow", "name") == "boundingTile";
        if (hasFlag) {
            boundingTile = tile;
        }
    }

    return boundingTile;
}
function findDisplayTile(ourScene) {
    //find the display tile in the scene
    var ourTile;
    var tiles = ourScene.tiles;
    for (let tile of tiles) {
        if (tile.data.flags["journal-to-canvas-slideshow"]?.name == "displayTile") {
            ourTile = tile;
        }
    }

    return ourTile;
}
