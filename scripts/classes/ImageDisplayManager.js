import { ArtTileManager } from "./ArtTileManager.js";
import { HelperFunctions } from "./HelperFunctions.js";
import ImageVideoPopout from "./MultiMediaPopout.js";
/**
 * This class manages the images specifically, setting and clearing the tiles' images
 */
export class ImageDisplayManager {
    static async getTilesFromArtScene() {
        let artSceneID = await game.JTCS.utils.getSettingValue(
            "artGallerySettings",
            "dedicatedDisplayData.scene.value"
        );
        let ourScene = game.scenes.get(artSceneID);
        let artTiles = await game.JTCS.tileUtils.getSceneSlideshowTiles("art", true, {
            currentSceneID: artSceneID,
        });
        let artTileID = artTiles[0].id;

        let frameTiles = await game.JTCS.tileUtils.getSceneSlideshowTiles("frame", true, {
            currentSceneID: artSceneID,
        });
        let frameTileID = artTiles[0].linkedBoundingTile || frameTiles[0].id;

        return {
            ourScene: ourScene,
            artTileID: artTileID,
            frameTileID: frameTileID,
        };
    }

    /**
     * Update the texture of the tile to reflect the image we pass to it
     * @param {string} artTileID - the ID of the art tile
        * @param {string} frameTileID - the ID of the frame tile
        *@param {string} url - the URL/path of the image
        * @param {('anyScene'|'artScene'|'window'|'journalEntry')} method - the method via which we want to display the image
        * @param {string} sceneID - the optional ID of the scene in which we want to update the tile
     */
    static async updateTileObjectTexture(
        artTileID,
        frameTileID,
        url,
        method,
        sceneID = ""
    ) {
        let ourScene = game.scenes.get(sceneID);
        if (!ourScene) ourScene = game.scenes.viewed;

        let artTile = ourScene.tiles.get(artTileID);
        let frameTile = ourScene.tiles.get(frameTileID);

        //load the texture from the source
        if (!artTile || !url) {
            ui.notifications.error("Tile  or image not found");
            console.error(url, artTile, artTileID);
            return;
        }
        const tex = await loadTexture(url);

        if (!tex) {
            ui.notifications.error(
                `Error loading texture from '${url}'. Access to URL likely blocked by CORS policy.`
            );
            return;
        }
        let imageUpdate;

        if (!frameTile) {
            imageUpdate = await ImageDisplayManager.scaleArtTileToScene(
                artTile,
                tex,
                url,
                sceneID
            );
        } else {
            imageUpdate = await ImageDisplayManager.scaleArtTileToFrameTile(
                artTile,
                frameTile,
                tex,
                url,
                sceneID
            );
        }

        const updated = await ourScene
            .updateEmbeddedDocuments("Tile", [imageUpdate])
            .catch((error) =>
                ui.notifications.error(
                    `Default art tile in ${ourScene.name} couldn't be updated`
                )
            );
        if (updated && method === "artScene") {
            const { autoActivate, autoView } = await HelperFunctions.getSettingValue(
                "artGallerySettings",
                "dedicatedDisplayData.scene"
            );

            if (autoActivate) {
                ourScene.activate();
            }
            if (autoView) {
                ourScene.view();
            }
            if (
                game.user.isGM && //if we're GM
                ((!autoActivate && !autoView) || (ourScene.active && !ourScene.viewed)) //if the scene is neither set to activate or to view, notify that the image updated.
                // if the scene is active but not viewed, notify that the image updated
            ) {
                ui.notifications.info(
                    `Default Tile in Art Scene '${ourScene.name}'  successfully updated`
                );
            }
        }
    }

    static async scaleArtTileToScene(displayTile, tex, url, sceneID = "") {
        let displayScene = game.scenes.get(sceneID);
        if (!displayScene) displayScene = game.scenes.viewed;

        let displaySceneWidth =
            game.version >= 10 ? displayScene.width : displayScene.data.width;
        let displaySceneHeight =
            game.version >= 10 ? displayScene.height : displayScene.data.height;
        let dimensionObject = await ImageDisplayManager.calculateAspectRatioFit(
            tex.width,
            tex.height,
            displaySceneWidth,
            displaySceneHeight
            // displayScene.data.width,
            // displayScene.data.height
        );
        //scale down factor is how big the tile will be in the scene
        //make this scale down factor configurable at some point
        let scaleDownFactor = 200;
        dimensionObject.width -= scaleDownFactor;
        dimensionObject.height -= scaleDownFactor;
        //half of the scene's width or height is the center -- we're subtracting by half of the image's width or height to account for the offset because it's measuring from top/left instead of center
        //separate objects depending on the texture's dimensions --
        //create an 'update' object for if the image is wide (width is bigger than height)
        let wideImageUpdate = {
            _id: displayTile.id,
            width: dimensionObject.width,
            height: dimensionObject.height,
            img: url,
            x: scaleDownFactor / 2,
            y: displaySceneHeight / 2 - dimensionObject.height / 2,
        };
        //create an 'update' object for if the image is tall (height is bigger than width)
        let tallImageUpdate = {
            _id: displayTile.id,
            width: dimensionObject.width,
            height: dimensionObject.height,
            img: url,
            y: scaleDownFactor / 2,
            x: displaySceneWidth / 2 - dimensionObject.width / 2,
        };
        //https://stackoverflow.com/questions/38675447/how-do-i-get-the-center-of-an-image-in-javascript
        //^used the above StackOverflow post to help me figure that out
        //Determine if the image or video is wide, tall, or same dimensions and update depending on that

        if (dimensionObject.height > dimensionObject.width) {
            //if the height is longer than the width, use the tall image object
            return tallImageUpdate;
        } else if (dimensionObject.width > dimensionObject.height) {
            //if the width is longer than the height, use the wide image object
            return wideImageUpdate;
        }

        //if the image length and width are pretty much the same, just default to the wide image update object
        return wideImageUpdate;
    }

    static async scaleArtTileToFrameTile(artTile, frameTile, tex, url) {
        const frameTileWidth =
            game.version >= 10 ? frameTile.width : frameTile.data.width;
        const frameTileHeight =
            game.version >= 10 ? frameTile.height : frameTile.data.height;
        const frameTileX = game.version >= 10 ? frameTile.x : frameTile.data.x;
        const frameTileY = game.version >= 10 ? frameTile.y : frameTile.data.y;

        let dimensionObject = ImageDisplayManager.calculateAspectRatioFit(
            tex.width,
            tex.height,
            frameTileWidth,
            frameTileHeight
        );

        let imageUpdate = {
            _id: artTile.id,
            width: dimensionObject.width,
            height: dimensionObject.height,
            img: url,
            y: frameTileY,
            x: frameTileX,
        };
        //Ensure image is centered to bounding tile (stops images hugging the top left corner of the bounding box).
        let boundingMiddle = {
            x: frameTileX + frameTileWidth / 2,
            y: frameTileY + frameTileHeight / 2,
        };

        let imageMiddle = {
            x: imageUpdate.x + imageUpdate.width / 2,
            y: imageUpdate.y + imageUpdate.height / 2,
        };

        imageUpdate.x += boundingMiddle.x - imageMiddle.x;
        imageUpdate.y += boundingMiddle.y - imageMiddle.y;
        return imageUpdate;
    }
    /** Used snippet from the below stackOverflow answer to help me with proportionally resizing the images*/
    /*https://stackoverflow.com/questions/3971841/how-to-resize-images-proportionally-keeping-the-aspect-ratio*/
    static calculateAspectRatioFit(srcWidth, srcHeight, maxWidth, maxHeight) {
        let ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
        return {
            width: srcWidth * ratio,
            height: srcHeight * ratio,
        };
    }
    static async displayImageInWindow(method, url) {
        if (method === "journalEntry") {
            let dedicatedDisplayData = await HelperFunctions.getSettingValue(
                "artGallerySettings",
                "dedicatedDisplayData"
            );
            const displayJournalID = dedicatedDisplayData.journal.value;
            const displayJournal = game.journal.get(displayJournalID);
            //if we would like to display in a dedicated journal entry
            if (!displayJournal) {
                //couldn't find display journal, so return
                if (game.user.isGM) {
                    ui.notifications.error(
                        `No Art Journal entry set! Please set your art journal in the module settings or Art Gallery Config`
                    );
                }
                return;
            } else {
                displayJournal.render(true);
            }

            //get the file type of the image url via regex match
            var fileTypePattern = /\.[0-9a-z]+$/i;
            var fileType = url.match(fileTypePattern);

            let journalMode = "image";
            let update;

            if (fileType == ".mp4" || fileType == ".webm") {
                if (game.version < 10) {
                    // if the file type is a video and we're before v10, we have to do a bit of a wonky workaround
                    let videoHTML = `<div style="height:100%; display: flex; flex-direction: column; justify-content:center; align-items:center;">
			<video width="100%" height="auto" autoplay loop>
  				<source src=${url} type="video/mp4">
  				<source src=${url} type="video/webm">
			</video>
			</div>
					`;

                    update = {
                        _id: displayJournal._id,
                        content: videoHTML,
                        img: "",
                    };
                    imageMode = "text";
                } else {
                    //if we're after v10
                    update = {
                        _id: displayJournal.id,
                        src: url,
                        video: {
                            loop: true,
                            autoplay: true,
                        },
                        type: "video",
                    };
                }
            } else {
                //change the background image to be the clicked image in the journal
                if (game.version < 10) {
                    update = {
                        _id: displayJournal.id,
                        content: "",
                        img: url,
                    };
                } else {
                    update = {
                        // _id: displayJournal.id,
                        src: url,
                        type: "image",
                    };
                }
            }
            let updated;
            if (game.version < 10) {
                updated = await displayJournal.update(update, {});
            } else {
                const firstPage = displayJournal.pages.contents[0];
                updated = await firstPage?.update({ _id: firstPage.id, ...update });
            }
            if (updated === null && game.user.isGM) {
                ui.notifications.error(
                    `Could not display image in Art Journal '${displayJournal.name}.'`
                );
            }
            const { autoActivate, autoView } = await HelperFunctions.getSettingValue(
                "artGallerySettings",
                "dedicatedDisplayData.journal"
            );

            if (autoActivate) displayJournal.show(journalMode, true);
            if (autoView && !displayJournal.sheet.rendered)
                displayJournal.sheet.render(true);

            if (game.user.isGM && !autoActivate && !autoView) {
                ui.notifications.info(
                    `Image in Art Journal '${displayJournal.name}' successfully updated`
                );
            }
        } else if (method === "window") {
            //if we would like to display in a new popout window
            let popout = new ImageVideoPopout(url, {
                shareable: true,
            })
                .render(true)
                .shareImage();
        }
    }

    /**
     * determine the location of the display
     * @param {*} imageElement - the imageElement
     * @param {*} location - the location we want to display our image in
     * @param {*} journalSheet  - the journal sheet in which we're performing these actions
     * @param {*} url
     */
    static async determineDisplayMethod(sheetImageData = { method: "window", url: "" }) {
        let { method, imageElement, url } = sheetImageData;
        if (!url && imageElement) {
            url = ImageDisplayManager.getImageSource(imageElement);
        } else if (!url && !imageElement) {
            console.error("No image data passed to this method", url, imageElement);
        }
        //on click, this method will determine if the image should open in a scene or in a display journal
        switch (method) {
            case "artScene":
                let artSceneID = await HelperFunctions.getSettingValue(
                    "artGallerySettings",
                    "dedicatedDisplayData.scene.value"
                );
                let artScene = game.scenes.get(artSceneID);
                if (artScene) {
                    let defaultArtTileID = await ArtTileManager.getDefaultArtTileID(
                        artScene
                    );
                    if (!defaultArtTileID) {
                        ui.notifications.error(
                            "No valid 'Art Tile' found in scene '" + artScene.name + "'"
                        );
                        return;
                    }
                    let frameTileID = await ArtTileManager.getGalleryTileDataFromID(
                        defaultArtTileID,
                        "linkedBoundingTile",
                        artSceneID
                    );
                    await ImageDisplayManager.updateTileObjectTexture(
                        defaultArtTileID,
                        frameTileID,
                        url,
                        method,
                        artSceneID
                    );
                }
                break;
            case "anyScene":
                let { artTileID, frameTileID } = sheetImageData;
                //if the setting is to display it in a scene, proceed as normal

                if (method === "anyScene" && !artTileID) {
                    artTileID = await ArtTileManager.getDefaultArtTileID(
                        game.scenes.viewed
                    );
                    if (!artTileID) {
                        ui.notifications.error(
                            "No valid 'Art Tile' found in current scene"
                        );
                        return;
                    }
                    frameTileID = await ArtTileManager.getGalleryTileDataFromID(
                        artTileID,
                        "linkedBoundingTile"
                    );
                }
                await ImageDisplayManager.updateTileObjectTexture(
                    artTileID,
                    frameTileID,
                    url,
                    method
                );
                break;
            case "journalEntry":
            case "window":
                await ImageDisplayManager.displayImageInWindow(method, url);
                break;
        }
    }

    static getImageSource(imageElement) {
        let type = imageElement.nodeName;
        let url;

        if (type == "IMG") {
            //if it's an image element
            url = imageElement.getAttribute("src");
        } else if (type == "VIDEO") {
            //if it's a video element
            url = imageElement.getElementsByTagName("source")[0]?.getAttribute("src");
            if (!url) {
                url = imageElement.getAttribute("src");
            }
        } else if (type == "DIV" && imageElement.classList.contains("lightbox-image")) {
            //if it's a lightbox image on an image-mode journal
            //https://stackoverflow.com/questions/14013131/how-to-get-background-image-url-of-an-element-using-javascript --
            let imgStyle = imageElement.style;
            url = imgStyle.backgroundImage.slice(4, -1).replace(/['"]/g, "");
        } else {
            ui.notifications.error("Type not supported");
            url = null;
        }
        if (!url) {
            ui.notifications.error("url not found");
        }
        return url;

        //load the texture from the source
    }

    static async clearDisplayWindow() {
        if (!findDisplayJournal()) {
            return;
        }
        let url =
            "/modules/journal-to-canvas-slideshow/artwork/HD_transparent_picture.png";
        let update = {
            _id: displayJournal.id,
            img: url,
            content: `<div></div>`,
        };

        const updated = await displayJournal.update(update, {});
    }

    static async clearTile(tileID, options = {}) {
        let { ourScene } = options;
        if (!ourScene) ourScene = game.scenes.viewed;
        const isBoundingTile = await ArtTileManager.getGalleryTileDataFromID(
            tileID,
            "isBoundingTile"
        );

        let propertyPath = "defaultTileImages.paths.artTilePath";
        if (isBoundingTile) {
            propertyPath = "defaultTileImages.paths.frameTilePath";
        }

        const clearImagePath = await HelperFunctions.getSettingValue(
            "artGallerySettings",
            propertyPath
        );

        var clearTileUpdate = {
            _id: tileID,
            img: clearImagePath,
        };
        await ourScene.updateEmbeddedDocuments("Tile", [clearTileUpdate]);
    }
}
