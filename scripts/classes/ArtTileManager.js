import { MODULE_ID } from "../debug-mode.js";
import { HelperFunctions, HelperFunctions as HF } from "./HelperFunctions.js";
import { ImageDisplayManager } from "./ImageDisplayManager.js";
/**
 * This class manages the Art and Bounding Tiles, creating them, showing them in the Config, and
 * getting and setting their values
 */

export class ArtTileManager {
    /**
     * Update the id of a Gallery Tile document
     * @param {String} oldTileID - the id of a tile that's now missing
     * @param {String} newTileID  - the id of a new tile we're linking it to
     */
    static async updateTileDataID(oldTileID, newTileID) {
        //this is an array of objects
        let tileDataArray = await ArtTileManager.getSceneSlideshowTiles("", false);

        //find object with id

        let index = tileDataArray.findIndex((tileData) => tileData.id === oldTileID);
        let tileObject = tileDataArray[index]; //.find((tileData) => tileData.id === oldTileID);
        tileObject = { ...tileObject, id: newTileID };

        //here we ensure that the info for the linked tiles are also getting updated. Find ones that match our old ID, and update them to our new id

        //replace the object at its original index with the object w/ the new id
        if (tileObject && index !== undefined) {
            tileDataArray.splice(index, 1, tileObject);

            if (tileObject.isBoundingTile) {
                /* if we're updating the id of a bounding tile, also update each art tile
                that its boundingTileId reference has the correct updated id within it
                */
                ArtTileManager.updateLinkedArtTiles(oldTileID, newTileID, tileDataArray);
            }

            //update all of the scene's Gallery Tiles flags  
            await ArtTileManager.updateAllSceneTileFlags(tileDataArray);
        } else {
            console.error("JTCS Art Gallery - Tile object not found ", { tileObject, tileDataArray, oldTileID, newTileID })
        }
    }

    /**
     *  Update multiple art tiles to be linked to a new frame tile
     * @param {string} oldFrameID - the id of the art tile's old frame
     * @param {string} newFrameID - the id of the art tile's new frame
     * @param {Array} tileDataArray - an array with all of the art tiles that are linked
     * @returns the array of updated art tiles
     */
    static async updateLinkedArtTiles(oldFrameID, newFrameID, tileDataArray) {
        //get art tiles that had us as their bounding tile
        let linkedArtTiles = [];
        let updatedLinkedArtTiles = [];
        linkedArtTiles = tileDataArray.filter(
            (tileData) => tileData.linkedBoundingTile === oldFrameID
        );
        //update them with our new ID
        updatedLinkedArtTiles = linkedArtTiles.map((tileData) => {
            return {
                ...tileData,
                linkedBoundingTile: newFrameID,
            };
        });
        updatedLinkedArtTiles.forEach((atData) => {
            let atIndex = tileDataArray.findIndex((item) => item.id === atData.id);
            tileDataArray.splice(atIndex, 1, atData);
        });
        return tileDataArray;
    }
    /**
     * Return default Display/Frame tile data
     * @param {boolean} isBoundingTile - is what we're looking for a bounding tile
     * @param {string} linkedBoundingTile - the id of the bounding tile
     * @returns 
     */
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

    /**
     * Create a tile in the current scene
     * apply the default image path from our JTCS settings to it, and return it
     */
    static async createTileInScene(isFrameTile) {
        let ourScene = game.scenes.viewed;
        let pathProperty = isFrameTile ? "frameTilePath" : "artTilePath";
        let imageManager = ImageDisplayManager;

        let imgPath = await HF.getSettingValue(
            "artGallerySettings",
            `defaultTileImages.paths.${pathProperty}`
        );
        if (!imgPath) {
            return;
        }
        //TODO: Modularize the creation/scaling of tiles into a separate function
        const tex = await foundry.canvas.loadTexture(imgPath);

        let sceneWidth = game.version >= 10 ? ourScene.width : ourScene.data.width;
        let sceneHeight = game.version >= 10 ? ourScene.height : ourScene.data.height;
        let dimensionObject = imageManager.calculateAspectRatioFit(
            tex.width,
            tex.height,
            sceneWidth,
            sceneHeight
        );

        let newTile = await ourScene.createEmbeddedDocuments("Tile", [
            {
                img: imgPath,
                width: dimensionObject.width,
                height: dimensionObject.height,
                x: sceneWidth / 2 - dimensionObject.width / 2,
                y: sceneHeight / 2 - dimensionObject.height / 2,
            },
        ]);
        console.log("JTCS Art Gallery - New Tile Created", newTile)
        return newTile;
    }

    static async createOrFindDefaultFrameTile() {
        let frameTile;
        let tileDataArray = (await ArtTileManager.getSceneSlideshowTiles()) || [];
        if (tileDataArray.length === 0) {
            ui.notifications.warn(
                "No frame tile detected in scene. Creating new frame tile alongside display tile"
            );
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
        let missingTiles = flaggedTiles.filter(
            (tileData) => !sceneTileIDs.includes(tileData.id)
        );
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
        let unlinkedTiles = sceneTileIDs.filter(
            (tileID) => !flaggedTileIDs.includes(tileID)
        );
        return unlinkedTiles;
    }

    /**
     *
     * @param {String} linkedFrameTileId - the frame tile linked to this art tile, if it is one
     * @param {String} tileObjectID - the ID of the tile being created
     * @param {Boolean} isBoundingTile - whether or not its a frame tile instead of an art tile
     */
    static async createTileData(linkedFrameTileId, tileObjectID, isBoundingTile = false) {
        let defaultData = await ArtTileManager.getDefaultData(
            isBoundingTile,
            linkedFrameTileId
        );
        await ArtTileManager.updateSceneTileFlags(defaultData, tileObjectID);
    }

    /**
     * Create a Tile in the current scene that is linked to the Tile Data we're passing in
     * @param {Object} options - the options object
     * @param {Boolean} options.isFrameTile - whether or not its a frame tile or an art tile
     * @param {String} options.linkedFrameTileID - the ID of the linked frame tile
     * @param {String} options.unlinkedDataID - the ID of the unlinked art gallery tile we want to link to a tile in the scene
     * @returns the new tile object in the scene that is linked to our previously unlinked data
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

            if (!unlinkedDataID) {
                console.log("Scene Gallery Config - Creating new tile data");
                await ArtTileManager.createTileData(
                    linkedFrameTileID,
                    tileObjectID,
                    false
                );
            } else {
                console.log(
                    "Scene Gallery Config | updating already created tile data, and linking it"
                );
                await ArtTileManager.updateTileDataID(unlinkedDataID, tileObjectID);
            }
            // debugger
        } else {
            ui.notifications.error("JTCS - Art Gallery | New art gallery tile couldn't be created");
        }
        return newTile;
    }

    /**
     * Create an art tile 
     * @param {String} linkedFrameTileId - the frame tile linked to this art tile, if it is one
     * @param {*} unlinkedDataID - if we're creating a new tile from the config rather than from the tile itself, it may have an unlinkedId
     * @returns  - the created art tile
     */
    static async createArtTileObject(_linkedFrameTileId = "", unlinkedDataID = "") {
        let linkedFrameTileId = _linkedFrameTileId;

        let newTile = await ArtTileManager.createTileInScene(false);

        //if this is a new tile, create its data
        if (newTile) {
            let tileObjectID = newTile[0].id;
            if (!unlinkedDataID) {
                await ArtTileManager.createTileData(
                    linkedFrameTileId,
                    tileObjectID,
                    false
                );
            } else {
                await ArtTileManager.updateTileDataID(unlinkedDataID, tileObjectID);
            }
        } else {
            ui.notifications.error("New display tile couldn't be created");
        }
        return newTile;
    }

    /**
     * Create a tile Object in scene linked to the unlinked Frame Tile data  
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
    /** 
     *  Legacy method to convert tiles from first version of JTCS
    */
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

    /** 
     *  Legacy method to convert tiles from first version of JTCS
    */
    static convertBoundingTile(tileData) {
        let defaultData = {
            displayName: "BoundingTile1",
            isBoundingTile: true,
            linkedBoundingTile: "",
        };
        updateSceneTileFlags(defaultData, tileData.id);
    }
    /**
     * Legacy method to convert tiles from first version of JTCS
     * @param {*} tileData 
     * @param {*} linkedBoundingTileId 
     */
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
        Hooks.callAll("updateDefaultArtTile", { updateData: tileID, currentScene });
    }
    /**
     * Gets the default art gallery tile in this scene, or returns the first tile in scene if not found
     * returns undefined if that is also not found
     * @param {Object} currentScene - the current scene doc
     */
    static async getDefaultArtTileID(currentScene) {
        if (!currentScene) currentScene = game.scenes.viewed;
        if (!currentScene) {
            return undefined
        }

        //get all the art tiles in the scene, filtering out the ones that aren't unlinked/missing
        let artTiles = (
            await ArtTileManager.getSceneSlideshowTiles("art", true, {
                currentSceneID: currentScene.id,
            })
        ).filter((item) => !item.missing);
        let defaultArtTileID = await currentScene.getFlag(MODULE_ID, "defaultArtTileID");

        // if the defaultArtTileID stored in our flags is
        let shouldReplaceID = false;
        const found = artTiles.find((tileData) => tileData.id === defaultArtTileID);

        if (!found) {
            //a tile with this ID wasn't in the scene, so replace it with a the first art tile that IS linked, or if there are none, replace it with an empty string
            shouldReplaceID = true;

            if (artTiles.length > 0) {
                defaultArtTileID = artTiles[0].id;
            } else {
                defaultArtTileID = "";
            }
        }
        // should
        if (shouldReplaceID) {
            await currentScene.setFlag(MODULE_ID, "defaultArtTileID", defaultArtTileID);
        }

        return defaultArtTileID;
    }

    /**
     * Get the slideshow/gallery tiles flag data from the scene,
     * find one with the appropriate id, and return either its data or a property within it
     * @param {string} tileID - the id of the tile
     * @param {string} property - a specific property we're looking for
     * @param {string} currentSceneID - the id of the scene we're looking within
     * @returns - either the flag data of the tile with the id, or a nested property
     */
    static async getGalleryTileDataFromID(tileID, property = "", currentSceneID = "") {
        if (!currentSceneID) currentSceneID = game.scenes.viewed.current;
        let flaggedTiles = await ArtTileManager.getSceneSlideshowTiles("", false, {
            currentSceneID,
        });
        let ourTile = flaggedTiles.find((data) => data.id === tileID);
        if (property) {
            if (ourTile) {
                return ourTile[property];
            } else {
                return "";
            }
        } else {
            return ourTile;
        }
    }

    /**
     * get tiles that have been stored by this module in a flag on this scene
     * @returns array of display tile data stored in "slideshowTiles" tag
     */
    static async getSceneSlideshowTiles(
        type = "",
        shouldCheckIfExists = false,
        options = { currentSceneID: "" }
    ) {
        let { currentSceneID } = options;
        let currentScene = game.scenes.viewed;
        if (currentSceneID) {
            currentScene = game.scenes.get(currentSceneID);
        }
        let flaggedTiles =
            (await currentScene.getFlag(
                "journal-to-canvas-slideshow",
                "slideshowTiles"
            )) || [];

        //check if the tile exists in the scene, and add a "missing" element if it does
        if (shouldCheckIfExists) {
            //get the ids of all the tiles in the scene
            let sceneTileIDs = currentScene.tiles.map((tile) => tile.id);

            // if our tile data's id isn't included in the ids of tiles in the scene, add a missing property
            flaggedTiles = flaggedTiles.map((tileData) =>
                !sceneTileIDs.includes(tileData.id)
                    ? { ...tileData, missing: true }
                    : tileData
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
    /**
     * Render the tile's config application
     * @param {string} tileID - tile whose config will be rendered 
     * @param {string} sceneID - the id of the scene
     */
    static async renderTileConfig(tileID, sceneID = "") {
        let tile = await game.scenes.viewed.getEmbeddedDocument("Tile", tileID);
        if (tile) {
            await tile.sheet.render(true);
        } else {
            ArtTileManager.displayTileNotFoundError(tileID);
        }
    }

    /**
     * Change a tile's z-index to the front or to its "default" to move 
     * it out of the way for convenience
     * @param {id} tileID - the id of the tile
     * @param {boolean} toFront - should we move it to the front
     * @returns 
     */
    static async toggleTileZ(tileID, toFront = true) {
        let tile = await game.scenes.viewed.getEmbeddedDocument("Tile", tileID);
        if (!tile) return;

        const zIndex = tile.object.zIndex;
        if (toFront) {
            //save the default z-index
            tile.defaultZ = zIndex;
            await game.scenes.viewed.updateEmbeddedDocuments("Tile", {
                _id: tileID,
                object: { zIndex: 300 },
            });
        } else {
            await game.scenes.viewed.updateEmbeddedDocuments("Tile", {
                _id: tileID,
                object: { zIndex: tile.defaultZ },
            });
        }
    }

    /**
     * Select a tile with an id in our viewed scene
     * @param {string} tileID - the id of the tile
     * @param {string} sceneID - the id of the scene in which we're looking for the tile
     */
    static async selectTile(tileID, sceneID = "") {

        let tile = await game.scenes.viewed.getEmbeddedDocument("Tile", tileID);
        if (tile) {
            await game.JTCS.utils.swapTools();
            tile.object.control({
                releaseOthers: true,
            });
        } else {
            ArtTileManager.displayTileNotFoundError(tileID);
        }
    }

    /**
     * Returrn an Art Tile's document's linked bounding/frame tile if it exists
     * @param {string} tileID - the id of the art tile
     * @param {string} flaggedTiles - the gallery tiles in the scene
     * @returns 
     */
    static async getLinkedFrameID(tileID, flaggedTiles) {
        let tileData = await ArtTileManager.getTileDataFromFlag(tileID, flaggedTiles);
        if (!tileData) {
            console.error("Could not find tile data with that ID");
        }
        return tileData.linkedBoundingTile;
    }
    /**
     * Get the DisplayTile data from a tile with the scene id
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
    /**
     * Returns a Tile document in either the viewed scene or the scene with the passed-in id
     * @param {string} tileID - the id of the tile we're looking for
     * @param {string} sceneID - the id of the scene (optional)
     * @returns the tile with the id, or nothing
     */
    static async getTileObjectByID(tileID, sceneID = "") {
        let ourScene = game.scenes.viewed;
        if (sceneID) ourScene = game.scenes.get(sceneID);
        let tile = await ourScene.getEmbeddedDocument("Tile", tileID);
        // debugger
        if (tileID.includes === "new") {
            // console.log("New tile created");
        } else {
            if (!tile) {
                ArtTileManager.displayTileNotFoundError(tileID);
            }
        }
        return tile;
    }

    /**
     * Display an error that a tile with this id was not found
     * @param {string} tileID - the id of the tile 
     * @param {string} sceneID - the id of our scene
     */
    static displayTileNotFoundError(tileID, sceneID = "") {
        console.error("JTCS - Art Gallery can't find tile in scene with ID " + tileID);
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

        //find tile with id from gallery tiles in scene
        if (tiles.find((tile) => tile.id === tileID)) {
            tiles = tiles.map((tileData) => {
                // if the ids match, update the matching one with the new displayName
                return tileData.id === tileID
                    ? { ...tileData, ...displayData }
                    : tileData; //else just return the original
            });
        } else {
            //if not found, create a new tile with our data and the associated id
            tiles.push({ id: tileID, ...displayData });
        }

        //update our scene flags with new tile or updated tiles
        await ArtTileManager.updateAllSceneTileFlags(tiles);
    }

    /**
     * Replace the slideshow tileData array stored in scene flags with the array passed in
     * @param {Array} tiles - the tiles array we want to update our flag with
     */
    static async updateAllSceneTileFlags(tiles, currentSceneID = "") {
        let currentScene = game.scenes.get(currentSceneID);
        if (!currentScene) currentScene = game.scenes.viewed;
        await currentScene.setFlag(
            "journal-to-canvas-slideshow",
            "slideshowTiles",
            tiles
        );
        Hooks.callAll("updateArtGalleryTiles", { currentScene, updateData: tiles });
    }
    static async deleteSceneTileData(tileID) {
        let tiles = await ArtTileManager.getSceneSlideshowTiles();
        //filter out the tile that matches this
        let deletedTileData = tiles.find((tileData) => tileData.id === tileID);
        tiles = tiles.filter((tileData) => tileData.id !== tileID);

        if (deletedTileData.isBoundingTile) {
            await ArtTileManager.updateLinkedArtTiles(tileID, "", tiles);
        }
        await ArtTileManager.updateAllSceneTileFlags(tiles);

        //call hook to delete the art tile data
    }

    static async getAllScenesWithSlideshowData() {
        let slideshowScenes =
            game.scenes.contents.filter((scene) => {
                if (game.version >= 10)
                    return scene.flags[`${MODULE_ID}`]?.slideshowTiles;
                else return scene.data.flags[`${MODULE_ID}`]?.slideshowTiles;
            }) || [];
        return slideshowScenes;
    }
}
