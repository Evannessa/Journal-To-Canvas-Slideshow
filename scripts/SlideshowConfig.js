"use strict";
import { convertToNewSystem } from "./HooksAndFlags.js";

const templates = [`modules/journal-to-canvas-slideshow/templates/tile-list-item.hbs`];

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

Hooks.on("canvasReady", async (canvas) => {
    //re-render the tile config
    if (game.JTCSlideshowConfig) {
        game.JTCSlideshowConfig.render(true);
    }

    //get tile data from scene flags
    let ourAPI = game.modules.get("journal-to-canvas-slideshow")?.api;

    let artTileDataArray = await ourAPI.getSceneSlideshowTiles("", true);

    //get the ids
    let artTileIDs = artTileDataArray.map((tileData) => tileData.id);

    game.scenes.viewed.tiles.forEach((tileDoc) => {
        //get tile data that matches the tiledocument in the scene
        let foundTileData = artTileDataArray.find((tileData) => tileData.id === tileDoc.id);
        if (foundTileData) {
            let type = foundTileData.isBoundingTile ? "frame" : "art";
            ourAPI.createTileIndicator(tileDoc, type);
            ourAPI.hideTileIndicator(tileDoc, type);
        }
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
            (item) => item.dataset.type !== type
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
            currentSceneName: game.scenes.viewed.name,
        };
    }

    async _handleButtonClick(event) {
        event.stopPropagation();
        event.preventDefault();
        let clickedElement = $(event.currentTarget);
        let action = clickedElement.data().action;
        let elementType = clickedElement.prop("tagName");

        //if we're clicking on a button within the list item, get the parent list item's id, else, get the list item's id
        let tileID = elementType === "button" ? clickedElement[0].parentNode.dataset.id : clickedElement[0].dataset.id;

        switch (action) {
            case "convert":
                convertToNewSystem();
                break;
            case "createDisplayTile":
                game.JTCS.createDisplayTile();
                break;
            case "createFrameTile":
                game.JTCS.createFrameTile();
                break;
            case "renderTileConfig":
                await game.JTCS.renderTileConfig(tileID);
                break;
            case "selectTile":
                await game.JTCS.selectTile(tileID);
                break;
            case "deleteTileData":
                await game.JTCS.selectTile(tileID);
                break;
        }
    }
    activateListeners(html) {
        super.activateListeners(html);
        html.off("click").on("click", "[data-action]", this._handleButtonClick.bind(this));
        html.on("mouseenter mouseleave", `li:not([data-missing='true'])`, this._handleHover.bind(this));
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
