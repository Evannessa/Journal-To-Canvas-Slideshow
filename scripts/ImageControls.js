import { getSlideshowFlags } from "./HooksAndFlags.js";
Hooks.once("init", () => {
    loadTemplates([`modules/journal-to-canvas-slideshow/templates/image-controls.hbs`]);
});

async function assignImageFlags(journalSheet, img, newImgData) {
    let journalEntry = journalSheet.object;

    let clickableImages = (await journalEntry.getFlag("journal-to-canvas-slideshow", "clickableImages")) || [];
    console.log(img.src);

    if (clickableImages.find((img) => img.path === img.src)) {
        clickableImages = clickableImages.map((imgData) => {
            // if the ids match, update the matching one with the new displayName
            return imgData.path === img.src ? { ...imgData, ...newImgData } : imgData; //else just return the original
        });
    } else {
        clickableImages.push({ path: img.src, ...newImgData });
    }

    await journalEntry.setFlag("journal-to-canvas-slideshow", "clickableImages", clickableImages);
}
export async function injectImageControls(element, journalSheet) {
    console.log(journal);
    let flaggedTiles = await getSlideshowFlags();
    let template = "modules/journal-to-canvas-slideshow/templates/image-controls.hbs";

    let displayTiles = flaggedTiles.filter((item) => !item.isBoundingTile);
    displayTiles = displayTiles.map((tile) => {
        return {
            tile: tile,
            randomID: foundry.utils.randomID(),
        };
    });

    let renderHtml = await renderTemplate(template, {
        displayTiles: displayTiles,
    });
    // $(element).parent().addClass("clickableImageContainer");
    $(element).parent().append(renderHtml);
    let radioButtons = element
        .closest(".editor-content")
        .querySelectorAll(`.clickableImageContainer input[type="radio"]`);
    radioButtons.forEach((button) => {
        button.addEventListener("change", (event) => {
            let value = event.currentTarget.value;
            console.log("Changed to: ", value);
            // assignImageFlags(journalSheet, element, value);
        });
    });
    // assignImageFlags(journalSheet, element, "");
}

export async function activateImageListeners(element) {}

export async function removeImageControls(element) {
    // $(element).parent().
}
