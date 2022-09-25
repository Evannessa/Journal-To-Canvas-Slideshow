import { MODULE_ID } from "../debug-mode.js";

const baseTemplatePath = `modules/${MODULE_ID}/templates/`;

const templateBaseNames = [
    `tile-list-item.hbs`,
    "tooltip.hbs",
    "control-button.hbs",
    `new-tile-list-item.hbs`,
    `icon-button.hbs`,
    `display-tile-config.hbs`,
    `image-controls.hbs`,
    `tile-link-partial.hbs`,
    `input-with-error.hbs`,
    `share-url-partial.hbs`,
    `fieldset-button-group.hbs`,
    `checkbox-chip-group.hbs`,
    `notification-badge.hbs`,
    `popover.hbs`,
    `item-list.hbs`,
    `item-menu.hbs`,
    `sheet-wide-controls.hbs`,
    `badge.hbs`,
    `delete-confirmation-prompt.hbs`,
    `scene-tile-wrapper.hbs`,
    `color-picker.hbs`,
];
/**
 * @param {*} templateBaseNameArray
 * @returns
 */
export function generateTemplates() {
    let templates = templateBaseNames.map((baseName) => createTemplatePathString(baseName));
    return templates;
}
export function createTemplatePathString(templateBaseName) {
    return `${baseTemplatePath}${templateBaseName}`;
}
export function mapTemplates(templates) {
    if (!templates) {
        templates = generateTemplates();
    }
    let mappedTemplates = {};

    templates.forEach((path) => {
        let baseName = path.split("/").pop().split(".").shift();
        mappedTemplates[baseName] = path;
    });

    return mappedTemplates;
}
