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
            icon: "fas fa-external-link-alt",
            tooltip: "display image in pop-out window",
            onClick: (event, options) => JTCSActions.onDisplayActionClick(event, "window", url),
        },
        journalEntry: {
            icon: "fas fa-book-open",
            tooltip: "display image in a dedicated journal entry",
            onClick: JTCSActions.onDisplayActionClick,
        },
        artScene: {
            icon: "far fa-image",
            tooltip: "display image in dedicated scene",
            onClick: JTCSActions.onDisplayActionClick,
        },
        anyScene: {
            icon: "fas fa-vector-square",
            tooltip: "display image in any scene with a frame tile and display tile",
            onClick: JTCSActions.onDisplayActionClick,
        },
        fadeJournal: {
            name: "fadeJournal",
            icon: "fas fa-eye-slash",
            tooltip: "Fade journal background to see canvas",
            additionalClass: "toggle push-down",
            additionalParentClass: "hover-reveal-right",
            multi: true,
            childButtons: [
                {
                    name: "fadeContent",
                    icon: "far fa-print-slash",
                    tooltip: "Fade journal AND all its content",
                    additionalClass: "toggle",
                },
            ],
        },
    };
}
