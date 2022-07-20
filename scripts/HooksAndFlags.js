Hooks.on("renderTileConfig", async (app, element) => {
    let currentScene = game.scenes.viewed;
    let flaggedTiles = await currentScene.getFlag("journal-to-canvas-slideshow", "slideshowTiles");
    let value = "";
    if (flaggedTiles) {
        value = await getTileNameFromFlag(app.object.data._id, flaggedTiles);
    }
    let html = `<div class="form-group">
			<label htmlFor="displayName">Display Name</label>
			<input type="text" name="displayName" id="displayName" placeholder="displayName" value="${value}"/>
		</div>`;
    const target = $(element).find(`[name="tint"]`).parent().parent();
    target.after(html);
});

//when the tile config is closed, check to see if the name has changed
Hooks.on("closeTileConfig", async (app, element) => {
    let displayData = $(app.form).find(`#displayName`);
    let tileData = app.object.data;
    let displayName = displayData[0].value;
    if (displayName) {
        await updateSceneTileFlags(displayName, tileData._id);
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

/**
 *
 * @param {string} tileId - the id of the tile in scene we're looking to filter
 * @param {Array} flaggedTiles - the flagged tiles
 * @returns the flag data
 */
async function getTileNameFromFlag(tileId, flaggedTiles) {
    if (!flaggedTiles) {
        return "";
    }

    let flaggedTile = flaggedTiles.find((tileData) => tileData.id === tileId);

    //if we find a tile
    if (flaggedTile) {
        return flaggedTile.displayName;
    } else {
        return "";
    }
}

async function updateSceneTileFlags(displayName, tileId) {
    let currentScene = game.scenes.viewed;
    let tiles = (await currentScene.getFlag("journal-to-canvas-slideshow", "slideshowTiles")) || [];

    if (tiles.find((tile) => tile.id === tileId)) {
        tiles = tiles.map((tileData) => {
            // if the ids match, update the matching one with the new displayName
            return tileData.id === tileId ? { ...tileData, displayName: displayName } : tileData; //else just return the original
        });
    } else {
        tiles.push({ id: tileId, displayName: displayName });
    }
    await currentScene.setFlag("journal-to-canvas-slideshow", "slideshowTiles", tiles);
}
