import { CanvasIndicators } from "./CanvasIndicators.js";
class ArtTileManager {
    static displayTileTexture = "/modules/journal-to-canvas-slideshow/assets/DarkBackground.webp";
    static frameTileTexture = "/modules/journal-to-canvas-slideshow/assets/Bounding_Tile.webp";

    // ...
    static async displayImageInScene(imageElement, selectedTileID, boundingTileID) {
        let url = imageElement.getAttribute("src");

        let displayTile = game.scenes.viewed.tiles.get(selectedTileID);

        //get the tile data from the selected tile id;

        let boundingTile = game.scenes.viewed.tiles.get(boundingTileID);
        if (!boundingTile) {
            await ArtTileManager.getTileByID(boundingTileID, game.scenes.viewed.id);
        }

        await ArtTileManager.updateTileInScene(displayTile, boundingTile, game.scenes.viewed, url);
    }

    static async updateTileInScene(displayTile, boundingTile, ourScene, url) {
        //load the texture from the source
        const tex = await loadTexture(url);
        var imageUpdate;

        if (!boundingTile) {
            imageUpdate = await ArtTileManager.scaleToScene(displayTile, tex, url);
        } else {
            imageUpdate = await ArtTileManager.scaleToBoundingTile(displayTile, boundingTile, tex, url);
        }

        const updated = await ourScene.updateEmbeddedDocuments("Tile", [imageUpdate]);
    }

    static async scaleToScene(displayTile, tex, url) {
        let displayScene = game.scenes.viewed;
        var dimensionObject = ArtTileManager.calculateAspectRatioFit(
            tex.width,
            tex.height,
            displayScene.data.width,
            displayScene.data.height
        );
        //scale down factor is how big the tile will be in the scene
        //make this scale down factor configurable at some point
        var scaleDownFactor = 200;
        dimensionObject.width -= scaleDownFactor;
        dimensionObject.height -= scaleDownFactor;
        //half of the scene's width or height is the center -- we're subtracting by half of the image's width or height to account for the offset because it's measuring from top/left instead of center

        //separate objects depending on the texture's dimensions --
        //create an 'update' object for if the image is wide (width is bigger than height)
        var wideImageUpdate = {
            _id: displayTile.id,
            width: dimensionObject.width,
            height: dimensionObject.height,
            img: url,
            x: scaleDownFactor / 2,
            y: displayScene.data.height / 2 - dimensionObject.height / 2,
        };
        //create an 'update' object for if the image is tall (height is bigger than width)
        var tallImageUpdate = {
            _id: displayTile.id,
            width: dimensionObject.width,
            height: dimensionObject.height,
            img: url, // tex.baseTexture.resource.url,
            y: scaleDownFactor / 2,
            x: displayScene.data.width / 2 - dimensionObject.width / 2,
        };
        //https://stackoverflow.com/questions/38675447/how-do-i-get-the-center-of-an-image-in-javascript
        //^used the above StackOverflow post to help me figure that out

        //Determine if the image or video is wide, tall, or same dimensions and update depending on that
        let testArray = [tallImageUpdate, wideImageUpdate];

        if (dimensionObject.height > dimensionObject.width) {
            //if the height is longer than the width, use the tall image object
            return tallImageUpdate;
            // return await displayScene.updateEmbeddedDocuments("Tile", [tallImageUpdate]);
        } else if (dimensionObject.width > dimensionObject.height) {
            //if the width is longer than the height, use the wide image object
            return wideImageUpdate;
            // return await displayScene.updateEmbeddedDocuments("Tile", [wideImageUpdate]);
        }

        //if the image length and width are pretty much the same, just default to the wide image update object
        return wideImageUpdate;
        // return await displayScene.updateEmbeddedDocuments("Tile", [wideImageUpdate]);
    }

    static async scaleToBoundingTile(displayTile, boundingTile, tex, url) {
        var dimensionObject = ArtTileManager.calculateAspectRatioFit(
            tex.width,
            tex.height,
            boundingTile.data.width,
            boundingTile.data.height
        );

        var imageUpdate = {
            _id: displayTile.id,
            width: dimensionObject.width,
            height: dimensionObject.height,
            img: url,
            y: boundingTile.data.y,
            x: boundingTile.data.x,
        };
        //Ensure image is centered to bounding tile (stops images hugging the top left corner of the bounding box).
        var boundingMiddle = {
            x: boundingTile.data.x + boundingTile.data.width / 2,
            y: boundingTile.data.y + boundingTile.data.height / 2,
        };

        var imageMiddle = {
            x: imageUpdate.x + imageUpdate.width / 2,
            y: imageUpdate.y + imageUpdate.height / 2,
        };

        imageUpdate.x += boundingMiddle.x - imageMiddle.x;
        imageUpdate.y += boundingMiddle.y - imageMiddle.y;
        // var updateArray = [];
        // updateArray.push(imageUpdate);
        return imageUpdate;
    }
    static async setNewDisplayTileTexture() {}
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

    static async createDisplayTile(_linkedFrameTileId = "") {
        let linkedFrameTileId = _linkedFrameTileId;
        // if (!linkedFrameTileId) {

        //     // linkedFrameTileId = await ArtTileManager.createOrFindDefaultFrameTile();
        // }
        let newTile = await ArtTileManager.createTileInScene(false);
        if (newTile) {
            let tileID = newTile[0].id;
            let defaultData = await ArtTileManager.getDefaultData(false, linkedFrameTileId);
            await ArtTileManager.updateSceneTileFlags(defaultData, tileID);
        } else {
            ui.notifications.error("New display tile couldn't be created");
        }
    }
    static async createFrameTile() {
        let newTile = await ArtTileManager.createTileInScene(true);
        if (newTile) {
            let tileID = newTile[0].id;
            if (tileID) {
                let defaultData = await ArtTileManager.getDefaultData(true, "");
                await ArtTileManager.updateSceneTileFlags(defaultData, tileID);
            }
        } else {
            ui.notifications.error("New frame tile couldn't be created");
        }
        return newTile;
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
    static async getTileByID(tileID, sceneID = "") {
        let tile = await game.scenes.viewed.getEmbeddedDocument("Tile", tileID);
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
        displayImageInScene: ArtTileManager.displayImageInScene,
        updateTileInScene: ArtTileManager.updateTileInScene,
        scaleToScene: ArtTileManager.scaleToScene,
        scaleToBoundingTile: ArtTileManager.scaleToBoundingTile,
        createDisplayTile: ArtTileManager.createDisplayTile,
        createFrameTile: ArtTileManager.createFrameTile,
        getSceneSlideshowTiles: ArtTileManager.getSceneSlideshowTiles,
        getDefaultData: ArtTileManager.getDefaultData,
        getFrameTiles: ArtTileManager.getFrameTiles,
        getDisplayTiles: ArtTileManager.getDisplayTiles,
        getTileByID: ArtTileManager.getTileByID,
        selectTile: ArtTileManager.selectTile,
        renderTileConfig: ArtTileManager.renderTileConfig,
        updateSceneTileFlags: ArtTileManager.updateSceneTileFlags,
        getTileDataFromFlag: ArtTileManager.getTileDataFromFlag,
        getUnlinkedTileIDs: ArtTileManager.getUnlinkedTileIDs,
        getMissingTiles: ArtTileManager.getMissingTiles,
        deleteSceneTileData: ArtTileManager.deleteSceneTileData,
        createTileIndicator: CanvasIndicators.createTileIndicator,
        deleteTileIndicator: CanvasIndicators.deleteTileIndicator,
        hideTileIndicator: CanvasIndicators.hideTileIndicator,
        showTileIndicator: CanvasIndicators.showTileIndicator,
        setUpIndicators: CanvasIndicators.setUpIndicators,
        updateSceneIndicatorColors: CanvasIndicators.updateSceneColors,
        updateUserIndicatorColors: CanvasIndicators.updateUserColors,
    };

    // now that we've created our API, inform other modules we are ready
    // provide a reference to the module api as the hook arguments for good measure
    Hooks.callAll("journalToCanvasSlideshowReady", game.modules.get("journal-to-canvas-slideshow").api);
});
