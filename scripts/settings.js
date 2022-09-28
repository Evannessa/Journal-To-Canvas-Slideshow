"use strict";
import { MODULE_ID, log } from "./debug-mode.js";
import { JTCSSettingsApplication } from "./classes/JTCSSettingsApplication.js";
import { HelperFunctions } from "./classes/HelperFunctions.js";
const assetFolderBasePath = `modules/${MODULE_ID}/assets/`;

export const artGalleryDefaultSettings = {
    sheetSettings: {
        name: "Sheet Types",
        // globalChoices: {
        //     //these will be radio buttons that control the checkboxes below
        //     hint: "Should we toggle which sheets show the image controls by their type (Actor, Item, Journal Entry), or would you like to toggle the controls on each individual sheet",
        //     chosen: "toggleType",
        //     onChange: (event, options = { value: "" }) => {
        //         let { value, app, html } = options;
        //         let areDisabled = value === "toggleType" ? false : true;
        //         html && html.find("#JTCSsheetSettings input[type='checkbox']").prop("disabled", areDisabled);
        //     },
        //     choices: {
        //         toggleType: "Toggle Sheets By Type",
        //         toggleEach: "Toggle Each Sheet Individually",
        //     },
        // },
        hint: `Which types of sheets would you like to show clickable image controls? <br/><br/> 
            <span class="accent"> Note: These options determine if these sheet types have the controls visible by default. You'll still be able to toggle controls on and off on each individual sheet regardless. </span>`,
        modularChoices: {
            journalEntry: true,
            actor: true,
            item: true,
        },
    },
    colorSchemeData: {
        name: "Custom Color Scheme",
        hint: `What colors would you like to use on parts of the JTCS UI? This will affect things like buttons, checkboxes, borders, etc.
        <br/> <br/> <span class="accent"> Hint: Click 'Apply Changes' to refresh this window and immediately see how your chosen colors look.</accent>
        `,
        colors: {
            accentColor: "#582eff",
            backgroundColor: "#ffffff",
        },
        propertyNames: {
            accentColor: "--JTCS-accent-color",
            backgroundColor: "--JTCS-background-color",
        },
        colorVariations: {
            accentColor: true,
            backgroundColor: true,
        },
        autoContrast: true,
    },
    dedicatedDisplayData: {
        journal: {
            name: "Art Journal",
            value: "",
            hint: "Art Journal",
        },
        scene: {
            name: "Art Scene",
            value: "",
            hint: "Art Scene",
        },
    },
    sheetFadeOpacityData: {
        name: "Sheet Fade Opacity",
        hint: "Change the opacity of the background when the sheet fades. The minimum is 20, nearly completely transparent, 100 means completely opaque. <br/> You must refresh any open journals after changing this value to see the difference.",
        value: 60,
    },
    fadeSheetImagesData: {
        name: "Fade Sheet Images",
        hint: "When fading a JournalEntry, Actor, or Item sheet, should the images fade as well as the background?",
        chosen: "fadeAll",
        choices: {
            fadeBackground: "Fade Background and UI Only",
            fadeAll: "Fade Background, UI AND Images",
        },
    },
    indicatorColorData: {
        name: "Tile Indicator Colors",
        hint: "Choose colors for the tile indicators, and the tile accent colors in the settings",
        colors: {
            frameTileColor: "#ed3000",
            artTileColor: "#009ec5",
            unlinkedTileColor: "#33ac4b",
            defaultTileColor: "#df00b2",
        },
        propertyNames: {
            frameTileColor: "--data-frame-color",
            artTileColor: "--data-art-color",
            unlinkedTileColor: "--data-unlinked-color",
            defaultTileColor: "--data-default-color",
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
        onChange: async (event) => {
            const updateData = await HelperFunctions.getSettingValue("artGallerySettings");
            Hooks.callAll("updateJTCSSettings", { origin: "JTCSSettings", updateData });
        },
    });
    new window.Ardittristan.ColorSetting(MODULE_ID, "JTCSAccentColor", {
        name: "Accent Color", // The name of the setting in the settings menu
        hint: "Choose an accent color to use in the JTCS UI", // A description of the registered setting and its behavior
        label: "Accent Color", // The text label used in the button
        restricted: true, // Restrict this setting to gamemaster only?
        defaultColor: "#44c3fdff", // The default color of the setting
        scope: "client", // The scope of the setting
        onChange: (value) => {
            Hooks.callAll("updateJTCSSettings", { origin: "JTCSSettings", updateData: value });
        }, // A callback function which triggers when the setting is changed
    });

    await game.settings.register("journal-to-canvas-slideshow", "areConfigInstructionsVisible", {
        name: "Visible Art Gallery Tile Config Instructions",
        hint: "Toggle whether the Art Gallery Configuration App will show instructions at the bottom of the application when you hover or not",
        scope: "world",
        config: true,
        type: Boolean,
        default: true,
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
