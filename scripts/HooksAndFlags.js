Hooks.once("init", () => {
    loadTemplates([`modules/journal-to-canvas-slideshow/templates/display-tile-config.hbs`]);
});

Hooks.on("renderTileConfig", async (app, element) => {
    let currentScene = game.scenes.viewed;
    let flaggedTiles = await currentScene.getFlag("journal-to-canvas-slideshow", "slideshowTiles");

    let defaultData = { displayName: "", isBoundingTile: false, linkedBoundingTile: "" };
    if (flaggedTiles) {
        defaultData = await getTileDataFromFlag(app.object.data._id, flaggedTiles);
        defaultData = { ...defaultData };
        defaultData.boundingTiles = getBoundingTiles(flaggedTiles);
    }

    let template = "modules/journal-to-canvas-slideshow/templates/display-tile-config.hbs";

    let renderHtml = await renderTemplate(template, defaultData);
    const target = $(element).find(`[name="tint"]`).parent().parent();
    target.after(renderHtml);
});

//when the tile config is closed, check to see if the name has changed
Hooks.on("closeTileConfig", async (app, element) => {
    let displayDataParent = $(app.form).find(`#displayTileData`)[0];
    let tileData = app.object.data;
    let displayData = {
        displayName: displayDataParent.querySelector("#displayName").value,
        isBoundingTile: displayDataParent.querySelector("#isBoundingTile").checked,
        linkedBoundingTile: displayDataParent.querySelector("#linkedBoundingTile").value,
    };

    if (displayData.displayName) {
        await updateSceneTileFlags(displayData, tileData._id);
    }
});

/**
 * filter out the tile to be deleted
 */
Hooks.on("preDeleteTile", async (app, element) => {
    let currentScene = game.scenes.viewed;
    let tileId = app.object.data._id;
    let flaggedTiles = await currentScene.getFlag("journal-to-canvas-slideshow", "slideshowTiles");
    if (flaggedTiles) {
        //filter out the tile that is to be deleted;
        flaggedTiles = flaggedTiles.filter((tileData) => tileData.id !== tileId);
        await currentScene.setFlag("journal-to-canvas-slideshow", "slideshowTiles", flaggedTiles);
    }
});

export async function convertToNewSystem() {
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

export async function convertBoundingTile(tileData) {
    let defaultData = { displayName: "BoundingTile1", isBoundingTile: true, linkedBoundingTile: "" };
    updateSceneTileFlags(defaultData, tileData.id);
}
export async function convertDisplayTile(tileData, linkedBoundingTileId = "") {
    let defaultData = { displayName: "DisplayTile1", isBoundingTile: false, linkedBoundingTile: linkedBoundingTileId };
    updateSceneTileFlags(defaultData, tileData.id);
}
export async function getSlideshowFlags() {
    let currentScene = game.scenes.viewed;
    let flaggedTiles = (await currentScene.getFlag("journal-to-canvas-slideshow", "slideshowTiles")) || [];
    return flaggedTiles;
}
export function getBoundingTiles(flaggedTiles) {
    return flaggedTiles.filter((tileData) => tileData.isBoundingTile);
}

/**
 *
 * @param {string} tileId - the id of the tile in scene we're looking to filter
 * @param {Array} flaggedTiles - the flagged tiles
 * @returns the flag data
 */
export async function getTileDataFromFlag(tileId, flaggedTiles) {
    let defaultData = { displayName: "", isBoundingTile: false, linkedBoundingTile: "" };
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

async function updateSceneTileFlags(displayData, tileId) {
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
    await currentScene.setFlag("journal-to-canvas-slideshow", "slideshowTiles", tiles);
}
