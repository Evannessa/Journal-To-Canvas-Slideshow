import { HelperFunctions } from "./classes/HelperFunctions.js";
import { log, MODULE_ID } from "./debug-mode.js";
// Model: The backend that contains all the data logic
// View: The frontend or graphical user interface (GUI)
// Controller: The brains of the application that controls how data is displayed
// import { artGalleryDefaultSettings } from "./settings.js";

export class SheetImageDataController {
    static checkFlags(documentCollectionName, flagName = "journal-to-canvas-slideshow") {
        let flaggedJournalEntries = game[documentCollectionName].contents.filter(
            (entry) => entry.data.flags["journal-to-canvas-slideshow"]
        );
        return flaggedJournalEntries;
    }
    static async getAllFlaggedSheets() {
        //get every journal entry with flags associated with this
        let flaggedJournals = SheetImageDataController.checkFlags("journal");
        let flaggedActors = SheetImageDataController.checkFlags("actors");
        let flaggedItems = SheetImageDataController.checkFlags("items");
        let flaggedDocs = [...flaggedJournals, ...flaggedActors, ...flaggedItems];
        return flaggedDocs;
    }

    /**
     *Remove any tile data from docs that has an id that was deleted
     * @param {*} removedTileID - remove any reference to a tile with this ID
     */
    static async removeTileDataFromDocs(removedTileID, sceneID) {
        let flaggedDocs = await SheetImageDataController.getAllFlaggedSheets();
        for (let doc of flaggedDocs) {
            let clickableImages = await HelperFunctions.getFlagValue(doc, "clickableImages");
            clickableImages = clickableImages.map((item) => {
                return {
                    ...item,
                    scenesData: item.scenesData.filter((sceneData) => removedTileID !== sceneData.selectedTileID),
                };
            });

            // map array of objects, and filter out any scenesdata objects in scenesDay array that hold the removed tile id
            await HelperFunctions.setFlagValue(doc, "clickableImages", clickableImages);
        }
    }

    /**
     * Store image data in flags
     * @param {App} journalSheet - the journal sheet whose images we're storing in the flag
     * @param {HTMLElement} imgElement - the image HTML element
     * @param {Obj} newImgData - the data being stored
     */
    static async updateImageFlags(journalSheet, imgElement, newImgData) {
        let journalEntry = journalSheet.object;
        let imageName = await SheetImageDataController.convertImageSourceToID(imgElement);
        let clickableImages = await HelperFunctions.getFlagValue(journalEntry, "clickableImages");
        let foundImage = clickableImages.find((imgData) => imgData.name === imageName);
        if (foundImage) {
            setProperty(foundImage, newImgData);
            // clickableImages = clickableImages.map((imgData) => {
            //     // if the ids match, update the matching one with the new displayName
            //     return imgData.name === imageName ? { ...imgData, ...newImgData } : imgData; //else just return the original
            // });
        } else {
            clickableImages.push({ name: imageName, ...newImgData });
        }

        await HelperFunctions.setFlagValue(journalEntry, "clickableImages", clickableImages);
        await HelperFunctions.setFlagValue(journalEntry, "linkedImageTilesByID", clickableImages);
    }

    // /**
    //  * Return data specific to the current viewed scene for the particular image in the journal entry, which should change when the scene does
    //  * @param {Object} imageFlagData - the data from the flag for this particular image in the journal entry
    //  * @returns the data specific to the current viewed scene
    //  */
    // static async getSceneSpecificImageData(imageFlagData) {
    //     let currentSceneID = game.scenes.viewed.data._id;
    //     return imageFlagData.scenesData?.find((obj) => obj.sceneID === currentSceneID); //want to get the specific data for the current scene
    // }

    static async getGalleryTileIDsFromImage(imageElement, journalSheet) {
        let imageData = await SheetImageDataController.getJournalImageFlagData(journalSheet.object, imageElement);
        if (!imageData) {
            console.error("could not get data from that sheet and element");
            return;
        }

        // imageData = await SheetImageDataController.getSceneSpecificImageData(imageData);

        let flaggedTiles = await game.JTCS.tileUtils.getSceneSlideshowTiles("", true);
        let artTileID = imageData.split(".").pop(); //if stored by uuid, should get the tile's id
        let frameTileID = await game.JTCS.tileUtils.getLinkedFrameID(artTileID, flaggedTiles);
        if (!artTileID) {
            console.error("Image data has no tile ID");
            return;
        }
        return {
            artTileID: artTileID,
            frameTileID: frameTileID,
        };
    }

    /**
     * Convert the image's path without extention to use as as an identifier to store it in flags
     * @param {Element} imgElement - the image element
     * @returns a string path
     */
    static async convertImageSourceToID(imgElement) {
        let name = imgElement.getAttribute("src");
        name = name.replace(/\.(gif|jpe?g|tiff?|png|webp|bmp)/g, "");
        return name;
    }
    /**
     *  get the flag data for this image in this journal entry
     * @param {Document} journalEntry - the journal entry whose flags we're looking in
     * @param {Element} imgElement - an HTML Image Element
     * @returns an object containing the data saved in the flags
     */
    static async getJournalImageFlagData(journalEntry, imgElement) {
        let clickableImages = (await HelperFunctions.getFlagValue(journalEntry, "clickableImages")) || [];
        // let clickableImages = (await journalEntry.getFlag("journal-to-canvas-slideshow", "clickableImages")) || [];
        let foundData = clickableImages.find((imgData) => {
            return imgData.name == imgElement.dataset["name"];
        });
        return { journalID: journalEntry.id, ...foundData };
    }

    /**
     * Returns all the necessary data in a bundled object
     * @param {Object} options - bundled options like the app, the html element, and the imgElement
     * @returns  Object
     */
    static async wrapSheetImageData(options) {
        let { app, html, imgElement } = options;
        let imageData = await SheetImageDataController.getJournalImageFlagData(app.object, imgElement);
        let galleryTileIDs = await SheetImageDataController.getGalleryTileIDsFromImage(imgElement, app);
        let sheetImageData = {
            imageElement: imgElement,
            ...imageData,
            ...galleryTileIDs,
            ...(!imageData.method && { method: options.method || "window" }), //if we don't have a location set, default to window
        };
        return sheetImageData;
    }
}
