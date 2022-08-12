import ImageVideoPopout from "../classes/MultiMediaPopout.js";

function findDisplayJournal() {
    let journalEntries = game.journal.contents;
    let foundDisplayJournal = false;
    journalEntries.forEach((element) => {
        //go through elements. If found, set bool to true. If not, it'll remain false. Return.
        if (element.name == "Display Journal") {
            displayJournal = element;
            foundDisplayJournal = true;
        }
    });
    return foundDisplayJournal;
}

async function createDisplayJournal() {
    //create a display journal
    if (!findDisplayJournal()) {
        displayJournal = await JournalEntry.create({
            name: "Display Journal",
        });
    } else {
        //if it already exists, render it and show to players
        displayJournal.render(false);
        if (displayJournal.data.img != "") {
            //if it's currentl on image mode
            displayJournal.show("image", true);
        } else {
            if (displayJournal.data.content != "") {
                displayJournal.show("text", true);
            }
        }
    }
}

/**
 * Display the image in a tile, either in a dedicated displayScene, or on a displayTile in any scene
 * @param {HTML element} imageElement - the image element in the journal entry
 * @param {app} journalSheet - the "journal sheet" application which holds our entry
 * @param {String} externalURL - an external url, if we aren't getting the image source from a clicked image
 * @returns
 */
export async function displayImageInScene(imageElement, journalSheet, externalURL = "") {
    //get the flaggedTiles in this particular scene
    let flaggedTiles = await getSlideshowFlags();
    //get the image source from the event, or return the url if it's a url
    let url = externalURL ? externalURL : getImageSource(imageElement);

    //get the image data from the clicked image, and the journal entry itself
    let imageData = await getJournalImageFlagData(journalSheet.object, imageElement);
    let sceneSpecificData = await getSceneSpecificImageData(imageData);
    console.log(sceneSpecificData);
    let selectedTileID = sceneSpecificData.selectedTileID;
    let displayTile = game.scenes.viewed.tiles.get(selectedTileID);

    //get the tile data from the selected tile id;
    let displayTileData = await getTileDataFromFlag(selectedTileID, flaggedTiles);
    let boundingTileID =
        displayTileData.linkedBoundingTile || flaggedTiles.filter((tileData) => tileData.isBoundingTile)[0].id;

    let boundingTile = game.scenes.viewed.tiles.get(boundingTileID);

    //if we're missing an image source, or any of the tiles, break out of this function
    if (!checkMeetsDisplayRequirements(url, displayTile, boundingTile)) {
        return;
    }

    await updateTileInScene(displayTile, boundingTile, game.scenes.viewed, url);

    game.JTCS.indicatorUtils.createTileIndicator(displayTile);

    //TODO: Rewrite auto-activate logic too
    // if (checkSettingEquals("autoShowDisplay", true)) {
    //     //if the settings have it set to automatically show the display, activate the scene
    //     await ourScene.activate();
    // }
}

function setEventListeners(html, app) {
    //look for the images and videos with the clickable image class, and add event listeners for being hovered over (to highlight and dehighlight),
    //and event listeners for the "displayImage" function when clicked
    // execute(html, app);
    wait().then(execute.bind(null, [html, app]));
}

function wait(callback) {
    return new Promise(function (resolve, reject) {
        resolve();
    });
}

function execute(args) {
    let [html, app] = args;

    // this one is for actor sheets. Right click to keep it from conflicting with the default behavior of selecting an image for the actor.
    if (checkSettingEquals("useActorSheetImages", true)) {
        html.find(".rightClickableImage").each((i, img) => {
            img.addEventListener("contextmenu", (event) => determineLocation(event, app), false);
        });
    }
}
