import { getSlideshowFlags } from "./HooksAndFlags.js";
import { displayImageInScene, changePopoutImage, getImageSource } from "./ClickImageInJournal.js";
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
 * @param {App} journalSheet - the journal sheet whose images we're stor
 * @param {HTMLElement} imgElement - the image element
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

    let imageFlagData = await getJournalImageFlagData(journalSheet.object, imgElement);

    let displayTiles = flaggedTiles.filter((item) => !item.isBoundingTile);
    displayTiles = displayTiles.map((tile) => {
        return {
            tile: tile,
            randomID: foundry.utils.randomID(),
        };
    });

    let renderHtml = await renderTemplate(template, {
        displayLocations: displayLocations,
        displayTiles: displayTiles,
        imgPath: imageName,
        ...imageFlagData,
    });
    $(imgElement).parent().addClass("clickableImageContainer");
    $(imgElement).parent().append(renderHtml);

    imgElement.addEventListener("click", (event) => {
        event.stopPropagation();
        event.stopImmediatePropagation();

        //TODO: Add location logic here
    });
    //for each display location button
    let locationButtons = imgElement
        .closest(".editor-content")
        .querySelectorAll(`.clickableImageContainer .displayLocations button`);
    locationButtons.forEach((button) => {
        //add a click event listener
        button.addEventListener("click", (event) => {
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
        });
    });

    let tileRadioButtons = imgElement
        .closest(".editor-content")
        .querySelectorAll(`.clickableImageContainer .displayTiles input[type="radio"]`);
    tileRadioButtons.forEach((button) => {
        button.addEventListener("change", (event) => {
            event.stopPropagation();
            event.stopImmediatePropagation();
            let value = event.currentTarget.value;
            assignImageFlags(journalSheet, imgElement, { selectedTileID: value });
        });
    });
}
/**
 * determine the location of the display
 * @param {*} imageElement - the imageElement
 * @param {*} location - the location we want to display our image in
 * @param {*} journalSheet  - the journal sheet in which we're performing these actions
 * @param {*} url
 */
async function determineDisplayLocation(imageElement, location, journalSheet, url) {
    // event.stopPropagation();

    //on click, this method will determine if the image should open in a scene or in a display journal
    switch (location) {
        case "displayScene":
        case "anyScene":
            //if the setting is to display it in a scene, proceed as normal
            await displayImageInScene(imageElement, journalSheet, url);
            break;
        case "window":
            if (url != undefined) {
                //if the url is not undefined, it means that this method is being called from the setUrlImageToShow() method
                changePopoutImage(url);
            } else {
                //if not, it happened because of an image click, so find the information of the clicked image
                getImageSource(event, changePopoutImage);
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
