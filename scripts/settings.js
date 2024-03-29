"use strict";
import { MODULE_ID, log } from "./debug-mode.js";
import { JTCSSettingsApplication } from "./classes/JTCSSettingsApplication.js";
import { HelperFunctions } from "./classes/HelperFunctions.js";
const assetFolderBasePath = `modules/${MODULE_ID}/assets/`;
export const colorThemes = {
    dark: {
        colorSchemeData: {
            colors: {
                backgroundColor: "#010527",
                accentColor: "#9876ff",
            },
        },
        indicatorColorData: {
            colors: {
                frameTileColor: "#2ec4b6",
                unlinkedTileColor: "#ff5369",
                artTileColor: "#ff9f1c",
                defaultTileColor: "#ff60f4",
            },
        },
    },
    light: {
        colorSchemeData: {
            colors: {
                accentColor: "#582eff",
                backgroundColor: "#ffffff",
            },
        },
        indicatorColorData: {
            colors: {
                frameTileColor: "#b44b00",
                artTileColor: "#009ec5",
                unlinkedTileColor: "#33ac4b",
                defaultTileColor: "#df00b2",
            },
        },
    },
};
export const artGalleryDefaultSettings = {
    sheetSettings: {
        name: "Sheet Types",

        hint: `Which types of sheets would you like to show clickable image controls? <br/><br/> 
            <span class="accent"> Note: These options determine if these sheet types have the controls visible by default. You'll still be able to toggle controls on and off on each individual sheet regardless. </span>`,
        modularChoices: {
            journalEntry: true,
            actor: true,
            item: true,
        },
    },
    colorSchemeData: {
        theme: "light",
        name: "Custom Color Scheme",
        hint: `What colors would you like to use on parts of the JTCS UI? This will affect things like buttons, checkboxes, borders, etc.
        <br/> <br/> <span class="accent"> Hint: Click 'Apply Changes' to refresh this window and immediately see how your chosen colors look.</accent>
        `,
        colors: {
            backgroundColor: "#010527",
            accentColor: "#9876ff",
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
        name: "Art Journal and Art Scene",
        hint: `Select your Art Journal and Art Scene. 
			These are "dedicated" displays, meaning if you choose the "Art Journal" or "Art Scene" actions on the sheet image controls or within the URL Share Dialog, 
			images will be sent directly to that scene or journal.
			<br/><br/>
			<a href="https://github.com/EvanesceExotica/Journal-To-Canvas-Slideshow/blob/master/features-and-walkthrough.md#window-popouts-art-journal-and-art-scene---upgraded-features">View the Features and Walkthrough document for a demonstration and More Info</a>
            .`,
        journal: {
            name: "Art Journal",
            value: "",
            hint: `Select your Art Journal, then choose additional functionality for what automatically happens when the image is changed
			<br/> <br/> <b>Auto Activate</b> - will automatically show the Journal Entry to you and all of your players
			<br/> <br/> <b>Auto View </b> - will render the journal entry for you but not your players (useful if you wish to check that the image properly updated)
			`,
            autoActivate: false,
            autoView: false,
        },
        scene: {
            name: "Art Scene",
            value: "",
            hint: `Select your Art Scene, then choose additional functionality for what automatically happens when the image is changed:
			<br/> <br/> <b>Auto Activate</b> - will automatically activate the scene for you and all of your players
			<br/> <br/> <b>Auto View</b> - will automatically view the scene for you (useful if you wish to check that the default tile image actually updated)
			<br/> <br/> Note: only scenes with a Default Art Tile will be able to be picked as your 'Art Scene'
			`,
            autoActivate: false,
            autoView: false,
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
            frameTileColor: "#2ec4b6",
            unlinkedTileColor: "#e71d36",
            artTileColor: "#ff9f1c",
            defaultTileColor: "#b260ff",
            // frameTileColor: "#ed3000",
            // artTileColor: "#009ec5",
            // unlinkedTileColor: "#33ac4b",
            // defaultTileColor: "#df00b2",
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
            const updateData = await HelperFunctions.getSettingValue(
                "artGallerySettings"
            );
            Hooks.callAll("updateJTCSSettings", { origin: "JTCSSettings", updateData });
        },
    });

    await game.settings.register(
        "journal-to-canvas-slideshow",
        "areConfigInstructionsVisible",
        {
            name: "Visible Art Gallery Tile Config Instructions",
            hint: "Toggle whether the Art Gallery Configuration App will show instructions at the bottom of the application when you hover or not",
            scope: "world",
            config: true,
            type: Boolean,
            default: true,
        }
    );

    game.settings.register("journal-to-canvas-slideshow", "showWelcomeMessage", {
        name: "Show Welcome Message",
        scope: "client",
        type: Boolean,
        config: true,
        default: true,
    });
};
