import { MODULE_ID } from "../debug-mode.js";
import { ImageDisplayManager } from "../classes/ImageDisplayManager.js";
export class JTCSActions {
    static async onDisplayActionClick(event, options = {}) {
        let { method, url } = options;
        await ImageDisplayManager.determineDisplayMethod({
            method: method,
            url: url,
        });
    }
    static displayActions = {
        window: {
            label: "Popout Window",
            icon: "fas fa-external-link-alt",
            tooltip: "display image in pop-out window",
            onClick: (event, options) => JTCSActions.onDisplayActionClick(event, "window", url),
        },
        journalEntry: {
            label: "Art Journal",
            icon: "fas fa-book-open",
            tooltip: "display image in your chosen 'Art Journal'",
            onClick: JTCSActions.onDisplayActionClick,
        },
        artScene: {
            label: "Art Scene",
            icon: "far fa-image",
            tooltip: "display image in your chosen 'Art Scene'",
            onClick: JTCSActions.onDisplayActionClick,
        },
        anyScene: {
            label: "Current Scene",
            icon: "fas fa-vector-square",
            tooltip: "display image on the Default Art Tile in the current scene",
            onClick: JTCSActions.onDisplayActionClick,
        },
    };
}
