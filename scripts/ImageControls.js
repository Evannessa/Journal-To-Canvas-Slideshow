import { getSlideshowFlags } from "./HooksAndFlags.js";
import { displayImageInScene, displayImageInWindow, getImageSource } from "./ClickImageInJournal.js";

class JournalImageControls {}

/**
 * Implement this factory function to clean things up
 * @param {*} imageElement
 * @param {*} sceneID
 * @param {*} selectedTileID
 * @param {*} displayLocation
 * @returns
 */
function createJournalImageData(imageElement, sceneID, selectedTileID, displayLocation) {
    return {
        name: convertImageSourceToID(imageElement),
    };
}
Hooks.on("canvasReady", (canvas) => {
    //! This should ONLY re-render if the editor is not actively being edited
    let renderedJournalSheets = Object.values(window.ui.windows).filter(
        (obj) => obj.document?.documentName === "JournalEntry" && obj.editors?.content.active === false //?editors.content.active === false ensures the editor is not being actively edited before re-rendering the entry
    );
    renderedJournalSheets.forEach((sheet) => sheet.render(true));
});

//changed, options, userId
// changed	object
// The differential data that was changed relative to the documents prior values

// options	object
// Additional options which modify the update request

// userId	string
// The id of the User requesting the document update
Hooks.on("updateJournalEntry", (app, changed, options, userId) => {
    // console.log(changed, options, userId);
    //TODO: If the images are changed; update
});

Hooks.once("init", () => {
    loadTemplates([`modules/journal-to-canvas-slideshow/templates/image-controls.hbs`]);
});

let displayLocations = [
    {
        name: "window",
        icon: "fas fa-external-link-alt",
        tooltip: "display image in pop-out window",
    },
    {
        name: "displayScene",
        icon: "far fa-image",
        tooltip: "display image in dedicated scene",
    },
    {
        name: "anyScene",
        icon: "fas fa-vector-square",
        tooltip: "display image in any scene with a frame tile and display tile",
    },
    {
        name: "journalEntry",
        icon: "fas fa-book-open",
        tooltip: "display image in a dedicated journal entry",
    },
];
/**
 * Store image data in flags
 * @param {App} journalSheet - the journal sheet whose images we're storing in the flag
 * @param {HTMLElement} imgElement - the image HTML element
 * @param {Obj} newImgData - the data being stored
 */
async function assignImageFlags(journalSheet, imgElement, newImgData) {
    let journalEntry = journalSheet.object;
    let imageName = convertImageSourceToID(imgElement);

    let clickableImages = (await journalEntry.getFlag("journal-to-canvas-slideshow", "clickableImages")) || [];

    if (clickableImages.find((imgData) => imgData.name === imageName)) {
        clickableImages = clickableImages.map((imgData) => {
            // if the ids match, update the matching one with the new displayName
            return imgData.name === imageName ? { ...imgData, ...newImgData } : imgData; //else just return the original
        });
    } else {
        clickableImages.push({ name: imageName, ...newImgData });
    }

    await journalEntry.setFlag("journal-to-canvas-slideshow", "clickableImages", clickableImages);
}

/**
 *  When the journal sheet renders, we're going to add controls over each image
 * @param {HTMLElement} imgElement - the image HTML element
 * @param {*} journalSheet - the journal sheet we're searching within
 */
export async function injectImageControls(imgElement, journalSheet) {
    let flaggedTiles = await getSlideshowFlags();
    let template = "modules/journal-to-canvas-slideshow/templates/image-controls.hbs";

    let imageName = convertImageSourceToID(imgElement);
    imgElement.dataset.name = imageName;

    //get the flags for this particular journal entry
    let imageFlagData = await getJournalImageFlagData(journalSheet.object, imgElement);
    //
    if (imageFlagData) {
        imageFlagData = imageFlagData.scenesData?.find((obj) => obj.sceneID === game.scenes.viewed.data._id); //want to get the specific data for the current scene
    }

    let displayTiles = flaggedTiles.filter((item) => !item.isBoundingTile);
    displayTiles = displayTiles.map((tile) => {
        return {
            tile: tile,
            randomID: foundry.utils.randomID(),
        };
    });

    let renderHtml = await renderTemplate(template, {
        currentSceneName: game.scenes.viewed.name,
        displayLocations: displayLocations,
        displayTiles: displayTiles,
        imgPath: imageName,
        ...imageFlagData,
    });
    $(imgElement).parent().addClass("clickableImageContainer");
    $(imgElement).parent().append(renderHtml);
    activateEventListeners({ journalSheet: journalSheet, imgElement: imgElement });
}

/**
 *
 * @param data - the data object
 */
function activateEventListeners(data) {
    let { journalSheet, imgElement } = data;

    let locationButtons = imgElement
        .closest(".editor-content")
        .querySelectorAll(`.clickableImageContainer .displayLocations button`);

    let tileRadioButtons = imgElement
        .closest(".editor-content")
        .querySelectorAll(`.clickableImageContainer .displayTiles input[type="radio"]`);

    imgElement.addEventListener("click", (event) => onImageClick(event, data));

    //for each display location button
    //add a click event listener
    locationButtons.forEach((button) => {
        button.addEventListener("click", (event) => onLocationButtonClick(event, data));
    });

    //for each radio button, which shows the display tiles in scene
    //add change and hover event listeners
    tileRadioButtons.forEach((button) => {
        button.addEventListener("change", (event) => onTileRadioButtonChange(event, data));
        button.nextElementSibling.addEventListener("mouseenter", (event) => onTileButtonLabelHover(event, data));
        button.nextElementSibling.addEventListener("mouseleave", (event) => onTileButtonLabelHover(event, data, true));
    });
}

async function onImageClick(event, data) {
    let { journalSheet, imgElement } = data;
    event.stopPropagation();
    event.stopImmediatePropagation();
    //get location data
    let imageData = await getJournalImageFlagData(journalSheet.object, imgElement);
    if (imageData.displayLocation) {
        determineDisplayLocation(imgElement, imageData.displayLocation, journalSheet);
    } else {
        determineDisplayLocation(imgElement, "displayScene", journalSheet);
    }
}

function onLocationButtonClick(event, data) {
    let { journalSheet, imgElement } = data;
    event.stopPropagation();
    event.stopImmediatePropagation();

    //get the action
    let location = event.currentTarget.dataset.action;
    //if control is pressed down, change the displayLocation to automatically be set to this when you click on the image
    if (event.ctrlKey) {
        //if the control key was also pressed
        assignImageFlags(journalSheet, imgElement, {
            displayLocation: location,
        });
    } else {
        //otherwise, just launch to the clicked button's display location
        determineDisplayLocation(imgElement, location, journalSheet);
    }
}

async function onTileButtonLabelHover(event, data, isLeave = false) {
    let scene = game.scenes.viewed;
    let { journalSheet, imgElement } = data;
    event.stopPropagation();
    event.stopImmediatePropagation();
    let tileId = event.currentTarget.previousElementSibling.value; //this should grab the value from the radio button itself
    addFilterToTile(tileId, isLeave ? 0 : 10);
}

function addFilterToTile(tileId, strength = 10) {
    let ourTile = game.scenes.viewed.getEmbeddedDocument("Tile", tileId);
    let filterBlur = new PIXI.filters.BlurFilter();
    filterBlur.blur = strength;
    ourTile._object.filters = [filterBlur];
}

function onTileRadioButtonChange(event, data) {
    let { journalSheet, imgElement } = data;
    event.stopPropagation();
    event.stopImmediatePropagation();
    let value = event.currentTarget.value;
    let updateData = {
        scenesData: [
            {
                sceneID: game.scenes.viewed.data._id,
                selectedTileID: value,
            },
        ],
    };
    assignImageFlags(journalSheet, imgElement, updateData);
}

/**
 * Return data specific to the current viewed scene for the particular image in the journal entry, which should change when the scene does
 * @param {Object} imageFlagData - the data from the flag for this particular image in the journal entry
 * @returns the data specific to the current viewed scene
 */
export async function getSceneSpecificImageData(imageFlagData) {
    let currentSceneID = game.scenes.viewed.data._id;
    return imageFlagData.scenesData?.find((obj) => obj.sceneID === currentSceneID); //want to get the specific data for the current scene
}

/**
 * determine the location of the display
 * @param {*} imageElement - the imageElement
 * @param {*} location - the location we want to display our image in
 * @param {*} journalSheet  - the journal sheet in which we're performing these actions
 * @param {*} url
 */
async function determineDisplayLocation(imageElement, location, journalSheet, url = "") {
    // event.stopPropagation();

    //on click, this method will determine if the image should open in a scene or in a display journal
    switch (location) {
        case "displayScene":
        case "anyScene":
            //if the setting is to display it in a scene, proceed as normal
            await displayImageInScene(imageElement, journalSheet, url);
            break;
        case "journalEntry":
            displayImageInWindow("journalEntry", getImageSource(imageElement));
            break;
        case "window":
            displayImageInWindow("window", getImageSource(imageElement));
            if (url != undefined) {
                //if the url is not undefined, it means that this method is being called from the setUrlImageToShow() method
            } else {
                //if not, it happened because of an image click, so find the information of the clicked image
                getImageSource(imageElement, displayImageInWindow);
            }
            break;
    }
}

/**
 * Convert the image's path without extention to use as as an identifier to store it in flags
 * @param {Element} imgElement - the image element
 * @returns a string path
 */
function convertImageSourceToID(imgElement) {
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
export async function getJournalImageFlagData(journalEntry, imgElement) {
    let clickableImages = (await journalEntry.getFlag("journal-to-canvas-slideshow", "clickableImages")) || [];
    let foundData = clickableImages.find((imgData) => {
        return imgData.name == imgElement.dataset["name"];
    });
    return foundData;
}

export async function activateImageListeners(element) {}

export async function removeImageControls(element) {
    // $(element).parent().
}
