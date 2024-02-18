import { HelperFunctions } from "./HelperFunctions";

Hooks.on("ready", ()=> {
    let app = new SheetConfigApp()
    app.render(true)
})

/**
 * Form app to handle JTCS settings
 */
export class SheetConfigApp extends FormApplication {
    constructor(data = {}) {
        super();
        this.data = data;
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["form"],
            width: 600,
            popOut: true,
            resizable: true,
            minimizable: true,
            submitOnClose: false,
            closeOnSubmit: true,
            submitOnChange: false,
            template: `modules/${MODULE_ID}/templates/sheet-config-app.hbs`,
            id: "Sheet Config App",
            title: "Sheet Config App",
            scrollY: [".form-content"],
            onsubmit: (event) => {},
        });
    }
     async getData() {
        // Send data to the template
        let allJournals = game.journal.contents;
        let journalOptions =  []
        for(let journal of allJournals){
            let onThisSheet = await HelperFunctions.getFlagValue(
                journal,
                "showControls",
                "",
                false
            ); 
            journalOptions.push(onThisSheet)
        }
        return {
            journalOptions
        };
    }

    async activateListeners(html) {
        // super.activateListeners(html);
        html = $(html[0].closest(".window-app"));
        this.hideButtons(html[0]);
        html.find(".window-content").attr("data-fade-all", true);
        // await this.setUIColors(html);
        // this._handleToggle(html);

        html.off("click").on(
            "click",
            "[data-action]",
            async (event) => await this.handleAction(event, "action", html)
        );

        let hoverEventString = "mouseenter mouseleave";
        let hoverActionSelectorString = `[data-hover-action], 
            [data-hover-action] + label`;

        html.off(hoverEventString, hoverActionSelectorString).on(
            hoverEventString,
            hoverActionSelectorString,
            async (event) => await this.handleAction(event, "hoverAction")
        );

        html.off("change").on(
            "change",
            "[data-change-action]",
            async (event) => await this.handleAction(event, "changeAction")
        );
    }
}

window.SheetConfigApp = SheetConfigApp;

