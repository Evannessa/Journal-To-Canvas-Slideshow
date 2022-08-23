"use strict";
import { MODULE_ID, log } from "./debug-mode.js";
import { JTCSSettingsApplication } from "./classes/JTCSSettingsApplication.js";
const assetFolderBasePath = `modules/${MODULE_ID}/assets/`;

export const artGalleryDefaultSettings = {
    sheetSettings: {
        name: "Sheet Types",
        hint: "Which types of sheets do you want to have clickable images?",
        globalChoices: {
            //these will be radio buttons that control the checkboxes below
            chosen: "all",
            onChange: (event, options = { value: "" }) => {
                let { value, app, html } = options;
                let areDisabled = value === "all" ? false : true;
                html && html.find("#JTCSsheetSettings input[type='checkbox']").prop("disabled", areDisabled);
            },
            choices: {
                all: "All Sheets",
                toggleEach: "Toggle Each Individually",
            },
        },
        modularChoices: {
            journalSheets: true,
            actorSheets: true,
            itemSheets: true,
        },
    },
    colorSchemeData: {
        name: "Color Scheme",
        hint: "Which color scheme would you like to use?",
        choices: {
            foundryDefault: "Default Foundry Color Scheme",
            jtcsDefault: "A Bluish Dark Theme",
        },
    },
    dedicatedDisplayData: {
        journal: {
            name: "Art Journal",
            value: "Art",
            hint: "Art Journal",
        },
        scene: {
            name: "Art Scene",
            value: "Art",
            hint: "Art Journal",
        },
    },
    journalFadeOpacityData: {
        name: "Journal Fade Opacity",
        hint: "Change the opacity of the background when the journal fades. 0 means completely transparent, 100 means completely opaque. You must refresh any open journals after changing this value to see the difference.",
        value: 0.5,
    },
    indicatorColorData: {
        name: "Tile Indicator Colors",
        hint: "Choose colors for the tile indicators",
        colors: {
            frameTileColor: "#cf4040",
            artTileColor: "#5e97ff",
            unlinkedTileColor: "#aaf3a2",
        },
    },
    defaultTileImages: {
        name: "Default Tile Images",
        hint: "Choose images for the Art and Frame tiles when they're first created, and for art tiles to reset to when the tile is 'cleared'",
        paths: {
            frameTilePath: `${assetFolderBasePath}Bounding_Tile.webp`,
            artTilePath: `${assetFolderBasePath}DarkBackground.webp`,
        },
    },
};

export const registerSettings = async function () {
    await game.settings.registerMenu(MODULE_ID, "JTCSSettingsMenu", {
        name: "JTCS Art Gallery Settings",
        label: "Open JTCS Art Gallery Settings",
        hint: "Configure extra Journal to Canvas Slideshow settings",
        icon: "fas fa-bars",
        type: JTCSSettingsApplication,
        restricted: true,
    });

    await game.settings.register(MODULE_ID, "artGallerySettings", {
        scope: "world", // "world" = sync to db, "client" = local storage
        config: false, // we will use the menu above to edit this setting
        type: Object,
        default: artGalleryDefaultSettings,
        onChange: (event) => {
            Hooks.callAll("updateJTCSSettings", event.currentTarget);
        },
    });

    game.settings.register("journal-to-canvas-slideshow", "journalFadeOpacity", {
        name: "Journal Fade Opacity",
        hint: "Change the opacity of the background when the journal fades. 0 means completely transparent, 100 means completely opaque. You must refresh any open journals after changing this value to see the difference.",
        scope: "client",
        config: true,
        type: Number,
        default: 50,
        range: {
            // range turns the UI input into a slider input
            min: 0,
            max: 100,
            step: 10,
        },
    });

    game.settings.register("journal-to-canvas-slideshow", "useActorSheetImages", {
        name: "Use Actor Sheet Images",
        hint: "If this is enabled, you can RIGHT CLICK on an image in an actor sheet to display it to your players. This is set to right click so it doesn't conflict with the default behavior of clicking on an actor's image.",
        scope: "client",
        config: true,
        type: Boolean,
        default: false,
    });

    game.settings.register("journal-to-canvas-slideshow", "showWelcomeMessage", {
        name: "Show Welcome Message",
        scope: "client",
        type: Boolean,
        config: true,
        default: true,
    });
};
