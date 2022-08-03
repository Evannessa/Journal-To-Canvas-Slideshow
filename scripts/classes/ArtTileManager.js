import { CanvasIndicators } from "./CanvasIndicators.js";
class ArtTileManager {
    static displayTileTexture = "/modules/journal-to-canvas-slideshow/artwork/DarkBackground.webp";
    static frameTileTexture = "/modules/journal-to-canvas-slideshow/artwork/Bounding_Tile.webp";

    // ...

    static async createFlagInScene() {}
    static async getDefaultData(isBoundingTile, linkedBoundingTile = "") {
        //determine its default name based on whether it's a bounding or display tile
        let displayName = isBoundingTile ? "frameTile" : "displayTile";
        displayName = await ArtTileManager.incrementTileDisplayName(displayName);
        //increment it if one already exists with that name
        return {
            displayName: `${displayName}`,
            isBoundingTile: isBoundingTile,
            linkedBoundingTile: linkedBoundingTile,
        };
    }

    static async incrementTileDisplayName(name) {
        let finalName = name;
        let tileDataArray = await ArtTileManager.getSceneSlideshowTiles();
        let conflictingTile = tileDataArray.find((tileData) => {
            return tileData.displayName.includes(name);
        });
        if (conflictingTile) {
            let digit = conflictingTile.displayName.match(/\d+/g);
            if (digit) {
                digit = parseInt(digit);
                digit++;
            } else {
                digit = 1;
            }
            finalName = finalName + digit;
        }
        return finalName;
    }

    static async createTileInScene(isFrameTile) {
        let ourScene = game.scenes.viewed;
        let imgPath = isFrameTile ? ArtTileManager.frameTileTexture : ArtTileManager.displayTileTexture;
        const tex = await loadTexture(imgPath);
        let dimensionObject = ArtTileManager.calculateAspectRatioFit(
            tex.width,
            tex.height,
            ourScene.data.width,
            ourScene.data.height
        );
        let newTile = await ourScene.createEmbeddedDocuments("Tile", [
            {
                img: imgPath,
                width: dimensionObject.width,
                height: dimensionObject.height,
                x: 0,
                y: ourScene.data.height / 2 - dimensionObject.height / 2,
            },
        ]);
        return newTile;
    }

    static async createOrFindDefaultFrameTile() {
        let frameTile;
        let tileDataArray = (await ArtTileManager.getSceneSlideshowTiles()) || [];
        if (tileDataArray.length === 0) {
            ui.notifications.warn("No frame tile detected in scene. Creating new frame tile alongside display tile");
            frameTile = await ArtTileManager.createFrameTile();
        } else {
            ui.notifications.warn(
                "No frame tile provided to when creating display tile. Linking display tile to first frame tile in scene"
            );
            frameTile = tileDataArray[0];
        }
        return frameTile.id;
    }

    static async createDisplayTile(_linkedFrameTileId) {
        let linkedFrameTileId = _linkedFrameTileId;
        if (!linkedFrameTileId) {
            linkedFrameTileId = await ArtTileManager.createOrFindDefaultFrameTile();
        }
        let newTile = await ArtTileManager.createTileInScene(false);
        if (newTile) {
            let tileId = newTile[0].id;
            let defaultData = await ArtTileManager.getDefaultData(false, linkedFrameTileId);
            await ArtTileManager.updateSceneTileFlags(defaultData, tileId);
        } else {
            ui.notifications.error("New display tile couldn't be created");
        }
    }
    static async createFrameTile() {
        let newTile = await ArtTileManager.createTileInScene(true);
        if (newTile) {
            let tileId = newTile[0].id;
            if (tileId) {
                let defaultData = await ArtTileManager.getDefaultData(true, "");
                await ArtTileManager.updateSceneTileFlags(defaultData, tileId);
            }
        } else {
            ui.notifications.error("New frame tile couldn't be created");
        }
    }

    //  Used snippet from the below stackOverflow answer to help me with proportionally resizing the images
    /*https://stackoverflow.com/questions/3971841/how-to-resize-images-proportionally-keeping-the-aspect-ratio*/
    static calculateAspectRatioFit(srcWidth, srcHeight, maxWidth, maxHeight) {
        var ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
        return {
            width: srcWidth * ratio,
            height: srcHeight * ratio,
        };
    }

    static async convertToNewSystem() {
        let currentScene = game.scenes.viewed;
        let sceneTiles = currentScene.tiles.contents;
        let boundingTile;
        let displayTile;
        sceneTiles.forEach(async (tile) => {
            let flag = await tile.getFlag("journal-to-canvas-slideshow", "name");
            switch (flag.name) {
                case "boundingTile":
                    boundingTile = tile;
                    break;
                case "displayTile":
                    displayTile = tile;
                    break;
                default:
                    break;
            }
        });
        if (boundingTile) {
            convertBoundingTile(boundingTile.data);
            if (displayTile) {
                convertDisplayTile(displayTile.data, boundingTile.id);
            }
        } else {
            if (displayTile) {
                convertDisplayTile(displayTile.data);
            }
        }
    }

    static convertBoundingTile(tileData) {
        let defaultData = { displayName: "BoundingTile1", isBoundingTile: true, linkedBoundingTile: "" };
        updateSceneTileFlags(defaultData, tileData.id);
    }
    static convertDisplayTile(tileData, linkedBoundingTileId = "") {
        let defaultData = {
            displayName: "DisplayTile1",
            isBoundingTile: false,
            linkedBoundingTile: linkedBoundingTileId,
        };
        updateSceneTileFlags(defaultData, tileData.id);
    }

    /**
     * get tiles that have been stored by this module in a flag on this scene
     * @returns array of display tile data stored in "slideshowTiles" tag
     */
    static async getSceneSlideshowTiles(type = "", shouldCheckIfExists = false) {
        let currentScene = game.scenes.viewed;
        let flaggedTiles = (await currentScene.getFlag("journal-to-canvas-slideshow", "slideshowTiles")) || [];

        //check if the tile exists in the scene, and add a "missing" element if it does
        if (shouldCheckIfExists) {
            //get the ids of all the tiles in the scene
            let sceneTileIDs = currentScene.tiles.map((tile) => tile.id);

            // if our tile data's id isn't included in the ids of tiles in the scene, add a missing property
            flaggedTiles = flaggedTiles.map((tileData) =>
                !sceneTileIDs.includes(tileData.id) ? { ...tileData, missing: true } : tileData
            );
        }

        if (type === "frame") {
            return ArtTileManager.getFrameTiles(flaggedTiles);
        } else if (type === "art") {
            return ArtTileManager.getDisplayTiles(flaggedTiles);
        }

        return flaggedTiles;
    }

    /**
     * Returns the "bounding" or "frame" tiles from the scene's displayTiles flag
     * @param {Array} flaggedTiles - array of Display Tiles from a scene flag
     * @returns filtered array with only the bounding tiles
     */
    static getFrameTiles(flaggedTiles) {
        return flaggedTiles.filter((tileData) => tileData.isBoundingTile);
    }
    /**
     * Returns the Display tiles from the scene's displayTiles flag array
     * @param {Array} flaggedTiles - array of SlideshowTiles from the scene's flag
     * @returns filtered array with only the display tiles
     */
    static getDisplayTiles(flaggedTiles) {
        return flaggedTiles.filter((tileData) => !tileData.isBoundingTile);
    }
    static async renderTileConfig(tileID, sceneID = "") {
        let tile = await game.scenes.viewed.getEmbeddedDocument("Tile", tileID);
        if (tile) {
            await tile.sheet.render(true);
        } else {
            ArtTileManager.displayTileNotFoundError(tileID);
            ui.notifications.error("JTCS can't find tile in scene with ID " + tileID);
        }
    }

    static showTileBorder(tileID, strength = 10, sceneID = "") {
        let tile = game.scenes.viewed.getEmbeddedDocument("Tile", tileID);
        if (tile) {
            let filterBlur = new PIXI.filters.BlurFilter();
            filterBlur.blur = strength;
            tile._object.filters = [filterBlur];
        } else {
            ArtTileManager.displayTileNotFoundError(tileID);
        }
    }
    static selectTile(tileID, sceneID = "") {
        let tile = game.scenes.viewed.getEmbeddedDocument("Tile", tileID);
        if (tile) {
            tile.object.control({
                releaseOthers: false,
            });
        } else {
            ArtTileManager.displayTileNotFoundError(tileID);
        }
    }

    /**
     * Get the DisplayTile data
     * @param {string} tileId - the id of the tile in scene we're looking to filter
     * @param {Array} flaggedTiles - the flagged tiles
     * @returns the flag data
     */
    static async getTileDataFromFlag(tileId, flaggedTiles) {
        let defaultData = ArtTileManager.getDefaultData(false, "");

        if (!flaggedTiles) {
            return defaultData;
        }

        let flaggedTile = flaggedTiles.find((tileData) => tileData.id === tileId);

        //if we find a tile
        if (flaggedTile) {
            return flaggedTile;
        } else {
            return defaultData;
        }
    }
    static async getTileByID(tileId, sceneID = "") {
        let tile = await game.scenes.viewed.getEmbeddedDocument("Tile", tileId);
        if (!tile) {
            ArtTileManager.displayTileNotFoundError(tileID);
        }
        return tile;
    }

    static displayTileNotFoundError(tileID, sceneID = "") {
        ui.notifications.error("JTCS can't find tile in scene with ID " + tileID);
    }

    /**
     * Update a tile in this scene with new data, or create a new one
     * @param {Object} displayData - the data we want to update with
     * @param {String} tileId - the id of the tile we want to update
     */
    static async updateSceneTileFlags(displayData, tileId) {
        if (!tileId) {
            return;
        }
        let currentScene = game.scenes.viewed;
        let tiles = (await currentScene.getFlag("journal-to-canvas-slideshow", "slideshowTiles")) || [];

        if (tiles.find((tile) => tile.id === tileId)) {
            tiles = tiles.map((tileData) => {
                // if the ids match, update the matching one with the new displayName
                return tileData.id === tileId ? { ...tileData, ...displayData } : tileData; //else just return the original
            });
        } else {
            tiles.push({ id: tileId, ...displayData });
        }

        await ArtTileManager.updateAllSceneTileFlags(tiles);
        // await currentScene.setFlag("journal-to-canvas-slideshow", "slideshowTiles", tiles);
    }

    static async updateAllSceneTileFlags(tiles) {
        let currentScene = game.scenes.viewed;
        await currentScene.setFlag("journal-to-canvas-slideshow", "slideshowTiles", tiles);
    }
    static async deleteSceneTileData(tileID) {
        let tiles = await ArtTileManager.getSceneSlideshowTiles();
        //filter out the tile that matches this
        tiles = tiles.filter((tileData) => tileData.id !== tileID);
        await ArtTileManager.updateAllSceneTileFlags(tiles);
    }
}

Hooks.on("init", () => {
    // my module needs to do something to set itself up (e.g. register settings)
    // ...

    // once set up, we create our API object
    game.modules.get("journal-to-canvas-slideshow").api = {
        createDisplayTile: ArtTileManager.createDisplayTile,
        createFrameTile: ArtTileManager.createFrameTile,
        getSceneSlideshowTiles: ArtTileManager.getSceneSlideshowTiles,
        getDefaultData: ArtTileManager.getDefaultData,
        getFrameTiles: ArtTileManager.getFrameTiles,
        getDisplayTiles: ArtTileManager.getDisplayTiles,
        getTileByID: ArtTileManager.getTileByID,
        showTileBorder: ArtTileManager.showTileBorder,
        selectTile: ArtTileManager.selectTile,
        renderTileConfig: ArtTileManager.renderTileConfig,
        updateSceneTileFlags: ArtTileManager.updateSceneTileFlags,
        deleteSceneTileData: ArtTileManager.deleteSceneTileData,
        createTileIndicator: CanvasIndicators.createTileIndicator,
        deleteTileIndicator: CanvasIndicators.deleteTileIndicator,
        hideTileIndicator: CanvasIndicators.hideTileIndicator,
        showTileIndicator: CanvasIndicators.showTileIndicator,
    };

    // now that we've created our API, inform other modules we are ready
    // provide a reference to the module api as the hook arguments for good measure
    Hooks.callAll("journalToCanvasSlideshowReady", game.modules.get("journal-to-canvas-slideshow").api);
});
