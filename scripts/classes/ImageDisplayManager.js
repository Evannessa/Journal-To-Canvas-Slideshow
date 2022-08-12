/**
 * This class manages the images specifically, setting and clearing the tiles' images
 */
export class ImageDisplayManager {
    static displayTileTexture = "/modules/journal-to-canvas-slideshow/assets/DarkBackground.webp";
    static frameTileTexture = "/modules/journal-to-canvas-slideshow/assets/Bounding_Tile.webp";
    static async displayImageInScene(imageElement, selectedTileID, boundingTileID) {
        let url = imageElement.getAttribute("src");

        let displayTile = game.scenes.viewed.tiles.get(selectedTileID);

        let boundingTile = game.scenes.viewed.tiles.get(boundingTileID);
        if (!boundingTile) {
            await game.JTCS.tileUtils.getTileByID(boundingTileID, game.scenes.viewed.id);
        }

        await game.JTCS.tileUtils.updateTileInScene(displayTile, boundingTile, game.scenes.viewed, url);
    }

    static async updateTileInScene(displayTile, boundingTile, ourScene, url) {
        //load the texture from the source
        const tex = await loadTexture(url);
        var imageUpdate;

        if (!boundingTile) {
            imageUpdate = await game.JTCS.tileUtils.scaleToScene(displayTile, tex, url);
        } else {
            imageUpdate = await game.JTCS.tileUtils.scaleToBoundingTile(displayTile, boundingTile, tex, url);
        }

        const updated = await ourScene.updateEmbeddedDocuments("Tile", [imageUpdate]);
    }

    static async scaleToScene(displayTile, tex, url) {
        let displayScene = game.scenes.viewed;
        var dimensionObject = game.JTCS.tileUtils.calculateAspectRatioFit(
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
            img: url,
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
        var dimensionObject = game.JTCS.tileUtils.calculateAspectRatioFit(
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
    //  Used snippet from the below stackOverflow answer to help me with proportionally resizing the images
    /*https://stackoverflow.com/questions/3971841/how-to-resize-images-proportionally-keeping-the-aspect-ratio*/
    static calculateAspectRatioFit(srcWidth, srcHeight, maxWidth, maxHeight) {
        var ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
        return {
            width: srcWidth * ratio,
            height: srcHeight * ratio,
        };
    }
    static async displayImageInWindow(method, url) {
        let displayName = game.settings.get("journal-to-canvas-slideshow", "displayName");
        // get the url from the image clicked in the journal
        //if popout doesn't exist
        if (method == "window") {
            //if we would like to display in a new popout window
            let popout = new ImageVideoPopout(url, {
                shareable: true,
            })
                .render(true)
                .shareImage();
        } else if (method == "journalEntry") {
            //if we would like to display in a dedicated journal entry
            if (!findDisplayJournal()) {
                //couldn't find display journal, so return
                ui.notifications.error(`No journal entry named ${displayName} found`);
                return;
            } else {
                displayJournal.render(true);
            }
            var fileTypePattern = /\.[0-9a-z]+$/i;
            var fileType = url.match(fileTypePattern);
            let update;

            if (fileType == ".mp4" || fileType == ".webm") {
                // if the file type is a video
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

                const updated = await displayJournal.update(update, {});
                displayJournal.show("text", true);
            } else {
                //change the background image to be the clicked image in the journal
                update = {
                    _id: displayJournal.id,
                    content: "",
                    img: url,
                };
                const updated = await displayJournal.update(update, {});
                displayJournal.show("image", true);
            }
        }
    }

    static async getImageSource(imageElement, myCallback) {
        let type = imageElement.nodeName;
        let url;

        if (type == "IMG") {
            //if it's an image element
            url = imageElement.getAttribute("src");
        } else if (type == "VIDEO") {
            //if it's a video element
            url = imageElement.getElementsByTagName("source")[0].getAttribute("src");
        } else if (type == "DIV" && imageElement.classList.contains("lightbox-image")) {
            //if it's a lightbox image on an image-mode journal
            //https://stackoverflow.com/questions/14013131/how-to-get-background-image-url-of-an-element-using-javascript --
            let imgStyle = imageElement.style;
            url = imgStyle.backgroundImage.slice(4, -1).replace(/['"]/g, "");
        } else {
            ui.notifications.error("Type not supported");
            url = null;
        }
        if (myCallback) {
            //if my callback is defined
            myCallback(url);
        }
        return url;

        //load the texture from the source
    }

    static async determineWhatToClear() {
        let location = game.settings.get("journal-to-canvas-slideshow", "displayLocation");
        if (location == "displayScene" || location == "anyScene") {
            clearDisplayTile();
        } else if (location == "window") {
            ImageDisplayManager.clearDisplayWindow();
        }
    }

    static async clearDisplayWindow() {
        if (!findDisplayJournal()) {
            return;
        }
        let url = "/modules/journal-to-canvas-slideshow/artwork/HD_transparent_picture.png";
        let update = {
            _id: displayJournal.id,
            img: url,
            content: `<div></div>`,
        };

        const updated = await displayJournal.update(update, {});
    }

    static async clearTile(tileObject) {
        let ourScene = game.scenes.viewed;
        // const tex = await loadTexture("/modules/journal-to-canvas-slideshow/assets/HD_transparent_picture.png");
        var clearTileUpdate = {
            _id: tileObject.id,
            img: "/modules/journal-to-canvas-slideshow/assets/HD_transparent_picture.png",
        };
        const updated = await ourScene.updateEmbeddedDocuments("Tile", [clearTileUpdate]);
    }

    static async checkMeetsDisplayRequirements(source, displayTile, boundingTile) {
        let doesMeetRequirements = true;

        //get the name of the scene or journal
        let displayName = game.settings.get("journal-to-canvas-slideshow", "displayName");
        if (!source) {
            ui.notifications.warn("Type not supported");
            doesMeetRequirements = false;
        }
        if (game.JTCS.utils.checkSettingEquals("displayLocation", "displayScene")) {
            if (!displaySceneFound()) {
                //if there is no display scene, return
                ui.notifications.error(
                    `No display scene found. Please make sure you have a scene named ${displayName}`
                );
                doesMeetRequirements = false;
            }
        }
        if (!displayTile) {
            ui.notifications.error("No display tile found -- make sure your scene has a display tile");
            doesMeetRequirements = false;
        }
        if (!boundingTile) {
            //if the scene isn't the display scene but has a bounding Tile
            //the scene we're using is the currently viewed scene
            ui.notifications.error(
                "No bounding tile present in scene. Please use the display scene if you wish to display without a bounding tile"
            );
            doesMeetRequirements = false;
        }

        return doesMeetRequirements;
    }
}
