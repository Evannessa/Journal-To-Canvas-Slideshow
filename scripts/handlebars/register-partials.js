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
];
export const registerPartials = function () {
    let templates = generateTemplates(templateBaseNames);
    loadTemplates(templates);
};
