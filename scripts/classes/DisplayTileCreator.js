class DisplayTileCreator {
    // ...

    static createDisplayTile(argument) {
        // does stuff you want other modules to have access to
    }
}

Hooks.on("init", () => {
    // my module needs to do something to set itself up (e.g. register settings)
    // ...

    // once set up, we create our API object
    game.modules.get("journal-to-canvas-slideshow").api = {
        createDisplayTile: DisplayTileCreator.createDisplayTile,
    };

    // now that we've created our API, inform other modules we are ready
    // provide a reference to the module api as the hook arguments for good measure
    Hooks.callAll("journalToCanvasSlideshowReady", game.modules.get("journal-to-canvas-slideshow").api);
});
