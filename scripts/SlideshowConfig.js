import { convertToNewSystem } from "./HooksAndFlags.js";
Hooks.on("renderApplication", (app) => {
    // console.log(app);
});

export class SlideshowConfig extends FormApplication {
    constructor(data) {
        super();
        this.data = data;
    }
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["form"],
            popOut: true,
            template: "modules/journal-to-canvas-slideshow/templates/config.html",
            id: "slideshow-config",
            title: "Slideshow Config",
        });
    }

    async getData() {
        //return data to template
        let ourScene = game.scenes.viewed;
        let shouldPromptConversion = false;
        let oldBoundingTile = await findBoundingTile(ourScene);
        let oldDisplayTile = await findDisplayTile(ourScene);
        if (oldBoundingTile || oldDisplayTile) {
            shouldPromptConversion = true;
        }
        return {
            shouldActivateDisplayScene: this.shouldActivateDisplayScene,
            promptConversion: shouldPromptConversion,
        };
    }

    _handleButtonClick(event) {
        event.stopPropagation();
        event.preventDefault();
        let clickedElement = $(event.currentTarget);

        let action = clickedElement.data().action;
        switch (action) {
            case "convert":
                convertToNewSystem();
                break;
            case "createDisplayTile":
                game.modules.get("journal-to-canvas-slideshow")?.api?.createDisplayTile();
                break;
            case "createFrameTile":
                game.modules.get("journal-to-canvas-slideshow")?.api?.createFrameTile();
                break;
        }
    }
    activateListeners(html) {
        super.activateListeners(html);
        html.off("click").on("click", "[data-action]", this._handleButtonClick.bind(this));
    }

    async _updateObject(event, formData) {}
}

window.SlideshowConfig = SlideshowConfig;
export function findBoundingTile(ourScene) {
    let tiles = ourScene.tiles.contents;
    let boundingTile;
    for (let tile of tiles) {
        let hasFlag = tile.getFlag("journal-to-canvas-slideshow", "name") == "boundingTile";
        if (hasFlag) {
            boundingTile = tile;
        }
    }

    return boundingTile;
}
function findDisplayTile(ourScene) {
    //find the display tile in the scene
    var ourTile;
    var tiles = ourScene.tiles;
    for (let tile of tiles) {
        if (tile.data.flags["journal-to-canvas-slideshow"]?.name == "displayTile") {
            ourTile = tile;
        }
    }

    return ourTile;
}
