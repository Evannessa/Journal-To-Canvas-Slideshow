export const registerSettings = function () {
    // function register(moduleName="journal-to-canvas-slideshow", settingName, )
    game.settings.register("journal-to-canvas-slideshow", "automatic", {
        name: "Automatic",
        hint: "Should every journal entry",
        scope: "client",
        config: true,
        type: Boolean,
        default: true,
    });

    game.settings.register("journal-to-canvas-slideshow", "tileIndicatorColors", {
        name: "Tile Indicator Colors",
        hint: "Choose colors for the tile indicators",
        scope: "client",
        config: true,
        type: Object,
        default: {
            frameTileColor: 0xff3300,
            artTileColor: 0x2f2190,
            unlinkedTileColor: 0xff33,
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
    game.settings.register("journal-to-canvas-slideshow", "colorScheme", {
        name: "Color Scheme",
        hint: "Which color scheme would you like to use?",
        scope: "client",
        config: true,
        type: String,
        choices: {
            foundryDefault: "Default Foundry Color Scheme",
            jtcsDefault: "A Bluish Dark Theme",
            // custom: "Pick your own colors",
        },
        default: "foundryDefault",
    });

    game.settings.register("journal-to-canvas-slideshow", "imageSaveLocation", {
        name: "Save Location",
        hint: "Set the default upload location for images dragged into a journal entry",
        scope: "client",
        config: true,
        type: String,
        default: "displayScene",
    });
    game.settings.register("journal-to-canvas-slideshow", "displayLocation", {
        name: "Display Location",
        hint: "Display clicked journal images in a dedicated display scene (default), in a separate window, or in any scene using a bounding tile.",
        scope: "client",
        config: true,
        type: String,
        choices: {
            displayScene: "Display Scene",
            window: "Window",
            anyScene: "Any Scene",
        },
        default: "displayScene",
        //	onChange: swapDisplayModes
    });

    game.settings.register("journal-to-canvas-slideshow", "autoShowDisplay", {
        name: "Automatically Show Display",
        hint: "Automatically activate the 'Display' scene or show the Display Journal/Window to players after clicking on a journal image",
        scope: "client",
        config: true,
        type: Boolean,
        default: false,
    });

    game.settings.register("journal-to-canvas-slideshow", "displayName", {
        name: "Display Name",
        hint: "What would you like to name the display scene, journal, or window?",
        scope: "client",
        config: true,
        type: String,
        default: "Display",
    });

    game.settings.register("journal-to-canvas-slideshow", "useActorSheetImages", {
        name: "Use Actor Sheet Images",
        hint: "If this is enabled, you can RIGHT CLICK on an image in an actor sheet to display it to your players. This is set to right click so it doesn't conflict with the default behavior of clicking on an actor's image.",
        scope: "client",
        config: true,
        type: Boolean,
        default: false,
    });

    game.settings.register("journal-to-canvas-slideshow", "displayWindowBehavior", {
        name: "Display Window Behavior",
        hint: "Would you like the display window to be a dedicated journal entry, or a new popout window that will appear each time you click on an image?",
        scope: "client",
        config: true,
        type: String,
        choices: {
            journalEntry: "Dedicated Journal Entry",
            newWindow: "New Window",
        },
        default: "journalEntry",
    });

    game.settings.register("journal-to-canvas-slideshow", "hideTileButtons", {
        name: "Hide Tile Buttons",
        hint: "Would you like to only show this module's scene control buttons in a separate window rather than all listed under the tile controls? \n This is so fewer buttons appear under the Tile control buttons \n Please switch to a different scene control and switch back if you activate this option to refresh the controls.",
        scope: "client",
        config: true,
        type: Boolean,
        default: false,
    });

    game.settings.register("journal-to-canvas-slideshow", "hideHeaderToggle", {
        name: "Hide Journal Header Toggle Button",
        hint: "Would you like to show a button at the top of the journal that allows you to easily toggle, abbreviate it to an icon with no text, or hide it? \n Note that you'll have to close and reopen any journal entries for this to take effect.",
        scope: "client",
        config: true,
        type: String,
        choices: {
            hide: "Hide Display Toggle Button",
            show: "Show Toggle Button With Name",
            iconOnly: "Show Button Icon Only",
        },
    });

    game.settings.register("journal-to-canvas-slideshow", "showWelcomeMessage", {
        name: "Show Welcome Message",
        scope: "client",
        type: Boolean,
        config: true,
        default: true,
    });
};
