import { MODULE_ID } from "../debug-mode.js";
/**
 * This class manages the Art and Bounding Tiles, creating them, showing them in the Config, and
 * getting and setting their values
 */

export class ArtTileManager {
    /**
     *
     * @param {String} oldTileID - the id of a tile that's now missing
     * @param {String newTileID  - the id of a new tile we're linking it to
     */
    static async updateTileDataID(oldTileID, newTileID) {
        //this is an array of objects
        let tileDataArray = await ArtTileManager.getSceneSlideshowTiles("", false);

        //find object with id
        let tileObject = tileDataArray.find((tileData) => tileData.id === oldTileID);
        let index = tileDataArray.indexOf(tileObject);
        tileObject = { ...tileObject, id: newTileID };

        //replace the object at its original index with the object w/ the new id
        if (tileObject && index) {
            tileDataArray.splice(index, 1, tileObject);
        }

        await ArtTileManager.updateAllSceneTileFlags(tileDataArray);
    }
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
        let pathProperty = isFrameTile ? "frameTilePath" : "artTilePath";
        let imageManager = game.JTCS.imageUtils.manager;

        let imgPath = await game.JTCS.utils.getSettingValue(
            "artGallerySettings",
            `defaultTileImages.paths.${pathProperty}`
        );
        if (!imgPath) {
            return;
        }
        const tex = await loadTexture(imgPath);
        let dimensionObject = imageManager.calculateAspectRatioFit(
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
            frameTile = await ArtTileManager.createFrameTileObject();
            return frameTile[0].id;
        } else {
            ui.notifications.warn(
                "No frame tile provided to when creating display tile. Linking display tile to first frame tile in scene"
            );
            frameTile = tileDataArray[0];
            return frameTile.id;
        }
    }

    /**
     * Return any tiles that have data, but their id doesn't match any tile in the scene
     * @param {Array} flaggedTiles - array of tiles with Slideshow data
     * @returns array of tiles that have data but aren't connected to a tile in the scene
     */
    static async getMissingTiles(flaggedTiles) {
        let currentScene = game.scenes.viewed;
        let sceneTileIDs = currentScene.tiles.map((tile) => tile.id);
        let missingTiles = flaggedTiles.filter((tileData) => !sceneTileIDs.includes(tileData.id));
        return missingTiles;
    }

    /**
     * Get tiles that aren't linked to any slideshow data
     * @param {Array} flaggedTiles - array of tiles with Slideshow data
     * @returns array of IDs of tiles that aren't linked to any slideshow data
     */
    static async getUnlinkedTileIDs(flaggedTiles) {
        let currentScene = game.scenes.viewed;
        let flaggedTileIDs = flaggedTiles.map((tileData) => tileData.id);
        let sceneTileIDs = currentScene.tiles.map((tile) => tile.id);
        let unlinkedTiles = sceneTileIDs.filter((tileID) => !flaggedTileIDs.includes(tileID));
        return unlinkedTiles;
    }

    /**
     *
     * @param {String} linkedFrameTileId - the frame tile linked to this art tile, if it is one
     * @param {String} tileObjectID - the ID of the tile being created
     * @param {Boolean} isBoundingTile - whether or not its a frame tile instead of an art tile
     */
    static async createTileData(linkedFrameTileId, tileObjectID, isBoundingTile = false) {
        let defaultData = await ArtTileManager.getDefaultData(isBoundingTile, linkedFrameTileId);
        await ArtTileManager.updateSceneTileFlags(defaultData, tileObjectID);
    }

    /**
     * Create a Tile in the current scene that is linked to the Tile Data we're passing in
     * @param {Object} options
     * @returns
     */
    static async createAndLinkSceneTile(
        options = {
            isFrameTile: false,
            linkedFrameTileID: "",
            unlinkedDataID: "",
        }
    ) {
        let { isFrameTile, linkedFrameTileID, unlinkedDataID } = options;

        let newTile = await ArtTileManager.createTileInScene(isFrameTile);

        if (newTile) {
            let tileObjectID = newTile[0].id;

            //
            if (!unlinkedDataID) {
                await ArtTileManager.createTileData(linkedFrameTileID, tileObjectID, false);
            } else {
                await ArtTileManager.updateTileDataID(unlinkedDataID, tileObjectID);
            }
        } else {
            ui.notifications.error("New display tile couldn't be created");
        }
        return newTile;
    }

    /**
     *
     * @param {String} linkedFrameTileId - the frame tile linked to this art tile, if it is one
     * @param {*} unlinkedDataID - if we're creating a new tile from the config rather than from the tile itself, it may have an unlinkedId
     * @returns  - the created art tile
     */
    static async createArtTileObject(_linkedFrameTileId = "", unlinkedDataID = "") {
        let linkedFrameTileId = _linkedFrameTileId;

        let newTile = await ArtTileManager.createTileInScene(false);
        if (newTile) {
            let tileObjectID = newTile[0].id;
            if (!unlinkedDataID) {
                await ArtTileManager.createTileData(linkedFrameTileId, tileObjectID, false);
            } else {
                await ArtTileManager.updateTileDataID(unlinkedDataID, tileObjectID);
            }
        } else {
            ui.notifications.error("New display tile couldn't be created");
        }
        return newTile;
    }

    /**
     * @param {String} linkedFrameTileId - the frame tile linked to this art tile, if it is one
     * @param {*} unlinkedDataID - if we're creating a new tile from the config rather than from the tile itself, it may have an unlinkedId
     * @returns  - the created frame tile
     * */
    static async createFrameTileObject(unlinkedDataID = "") {
        let newTile = await ArtTileManager.createTileInScene(true);
        if (newTile) {
            let tileObjectID = newTile[0].id;
            // let tileObjectID = newTile[0].document.id;
            if (!unlinkedDataID) {
                await ArtTileManager.createTileData("", tileObjectID, true);
            } else {
                await ArtTileManager.updateTileDataID(unlinkedDataID, tileObjectID);
            }
        } else {
            ui.notifications.error("New frame tile couldn't be created");
        }
        return newTile;
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
     * Set the default art gallery art tile in this scene
     * @param {String} tileID - the id of the art gallery tile that was clicked
     * @param {Object} currentScene - the current scene doc
     */
    static async setDefaultArtTileID(tileID, currentScene) {
        if (!currentScene) currentScene = game.scenes.viewed;
        await currentScene.setFlag(MODULE_ID, "defaultArtTileID", tileID);
        Hooks.callAll("updateDefaultArtTile", tileID, currentScene);
    }
    /**
     * Gets the default art gallery tile in this scene, or returns the first tile in scene if not found
     * returns undefined if that is also not found
     * @param {Object} currentScene - the current scene doc
     */
    static async getDefaultArtTileID(currentScene) {
        if (!currentScene) currentScene = game.scenes.viewed;
        let defaultArtTileID = await currentScene.getFlag(MODULE_ID, "defaultArtTileID");
        if (!defaultArtTileID) {
            //if you can't find it, default to the first tile in the scene
            //TODO: This should make sure the tile is in the scene
            let artTiles = (
                await ArtTileManager.getSceneSlideshowTiles("art", true, {
                    currentSceneID: currentScene.id,
                })
            ).filter((item) => !item.missing);

            if (artTiles.length > 0) {
                defaultArtTileID = artTiles[0].id;
            } else {
                ui.notifications.warn("No art or frame tiles found in this scene");
            }
            // defaultArtTileID = currentScene.tiles.contents[0]?.id;
        }
        return defaultArtTileID;
    }

    static async getGalleryTileDataFromID(tileID, property = "", currentSceneID = "") {
        let flaggedTiles = await this.getSceneSlideshowTiles("", false, { currentSceneID });
        let ourTile = flaggedTiles.find((data) => data.id === tileID);
        console.log("Did we find our tile?", ourTile);
        if (property) {
            return ourTile[property];
        } else {
            return ourTile;
        }
    }

    /**
     * get tiles that have been stored by this module in a flag on this scene
     * @returns array of display tile data stored in "slideshowTiles" tag
     */
    static async getSceneSlideshowTiles(type = "", shouldCheckIfExists = false, options = { currentSceneID: "" }) {
        let { currentSceneID } = options;
        let currentScene = game.scenes.viewed;
        if (currentSceneID) {
            currentScene = game.scenes.get(currentSceneID);
        }
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
        }
    }

    static async selectTile(tileID, sceneID = "") {
        let tile = await game.scenes.viewed.getEmbeddedDocument("Tile", tileID);
        if (tile) {
            await game.JTCS.utils.swapTools();
            tile.object.control({
                releaseOthers: false,
            });
        } else {
            ArtTileManager.displayTileNotFoundError(tileID);
        }
    }

    static async getLinkedFrameID(tileID, flaggedTiles) {
        let tileData = await ArtTileManager.getTileDataFromFlag(tileID, flaggedTiles);
        if (!tileData) {
            console.error("Could not find tile data with that ID");
        }
        return tileData.linkedBoundingTile;
    }
    /**
     * Get the DisplayTile data
     * @param {string} tileID - the id of the tile in scene we're looking to filter
     * @param {Array} flaggedTiles - the flagged tiles
     * @returns the flag data
     */
    static async getTileDataFromFlag(tileID, flaggedTiles) {
        let defaultData = ArtTileManager.getDefaultData(false, "");

        if (!flaggedTiles) {
            return defaultData;
        }

        let flaggedTile = flaggedTiles.find((tileData) => tileData.id === tileID);

        //if we find a tile
        if (flaggedTile) {
            return flaggedTile;
        } else {
            return defaultData;
        }
    }
    static async getTileObjectByID(tileID, sceneID = "") {
        let tile = await game.scenes.viewed.getEmbeddedDocument("Tile", tileID);
        if (tileID.includes === "new") {
            console.log("New tile created");
        } else {
            if (!tile) {
                ArtTileManager.displayTileNotFoundError(tileID);
            }
        }
        return tile;
    }

    static displayTileNotFoundError(tileID, sceneID = "") {
        ui.notifications.error("JTCS can't find tile in scene with ID " + tileID);
    }

    /**
     * Update a tile in this scene with new data, or create a new one
     * @param {Object} displayData - the data we want to update with
     * @param {String} tileID - the id of the tile we want to update
     */
    static async updateSceneTileFlags(displayData, tileID) {
        if (!tileID) {
            return;
        }
        let currentScene = game.scenes.viewed;
        let tiles = (await ArtTileManager.getSceneSlideshowTiles()) || [];
        // let tiles = (await currentScene.getFlag("journal-to-canvas-slideshow", "slideshowTiles")) || [];

        if (tiles.find((tile) => tile.id === tileID)) {
            tiles = tiles.map((tileData) => {
                // if the ids match, update the matching one with the new displayName
                return tileData.id === tileID ? { ...tileData, ...displayData } : tileData; //else just return the original
            });
        } else {
            tiles.push({ id: tileID, ...displayData });
        }

        await ArtTileManager.updateAllSceneTileFlags(tiles);
        // await currentScene.setFlag("journal-to-canvas-slideshow", "slideshowTiles", tiles);
    }

    /**
     * Replace the slideshow tileData array stored in scene flags with the array passed in
     * @param {Array} tiles - the tiles array we want to update our flag with
     */
    static async updateAllSceneTileFlags(tiles) {
        let currentScene = game.scenes.viewed;
        await currentScene.setFlag("journal-to-canvas-slideshow", "slideshowTiles", tiles);
        Hooks.callAll("updateArtGalleryTiles", currentScene, tiles);
    }
    static async deleteSceneTileData(tileID) {
        let tiles = await ArtTileManager.getSceneSlideshowTiles();
        //filter out the tile that matches this
        tiles = tiles.filter((tileData) => tileData.id !== tileID);
        let tilesAfter = tiles.map((tileData) => tileData.id);
        await ArtTileManager.updateAllSceneTileFlags(tiles);

        //call hook to delete the art tile data
        // Hooks.callAll("deleteArtTileData", tileID);
    }

    static async getAllScenesWithSlideshowData() {
        let slideshowScenes =
            game.scenes.contents.filter((scene) => scene.data.flags[`${MODULE_ID}`]?.slideshowTiles) || [];
        return slideshowScenes;
    }
}
