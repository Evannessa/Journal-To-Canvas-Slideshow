import { getSlideshowFlags } from "./HooksAndFlags.js";
Hooks.once("init", () => {
    loadTemplates([`modules/journal-to-canvas-slideshow/templates/image-controls.hbs`]);
});
export async function injectImageControls(element) {
    let flaggedTiles = await getSlideshowFlags();
    let template = "modules/journal-to-canvas-slideshow/templates/image-controls.hbs";

    let renderHtml = await renderTemplate(template, {
        displayTiles: flaggedTiles.filter((item) => !item.isBoundingTile),
    });
    $(element).parent().addClass("clickableImageContainer");
    $(element).parent().append(renderHtml);
}
export async function removeImageControls(element) {
    // $(element).parent().
}
