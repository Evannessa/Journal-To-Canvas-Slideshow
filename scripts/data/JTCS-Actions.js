import { MODULE_ID } from "../debug-mode.js";
export class JTCSActions {
    static displayActions = [
        {
            name: "window",
            icon: "fas fa-external-link-alt",
            tooltip: "display image in pop-out window",
        },
        {
            name: "journalEntry",
            icon: "fas fa-book-open",
            tooltip: "display image in a dedicated journal entry",
        },
        {
            name: "displayScene",
            icon: "far fa-image",
            tooltip: "display image in dedicated scene",
        },
        {
            name: "anyScene",
            icon: "fas fa-vector-square",
            tooltip: "display image in any scene with a frame tile and display tile",
        },
        {
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
    ];
}
