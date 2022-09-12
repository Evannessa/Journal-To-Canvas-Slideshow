import { log, MODULE_ID } from "../debug-mode.js";
import { artGalleryDefaultSettings } from "../settings.js";
/**
 * Form app to handle JTCS settings
 */
Hooks.on("renderJTCSSettingsApplication", (app) => {
    game.JTCSSettingsApp = app;
});
export class JTCSSettingsApplication extends FormApplication {
    constructor(data = {}) {
        super();
        // this.data = data;
        this.data = game.JTCS.utils.getSettingValue("artGallerySettings");
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["form"],
            popOut: true,
            resizable: true,
            minimizable: true,
            submitOnClose: true,
            closeOnSubmit: true,
            submitOnChange: false,
            template: `modules/${MODULE_ID}/templates/JTCS-settings-app.hbs`,
            id: "JTCSSettingsApplication",
            title: " JTCSSettings Application",
        });
    }

    async getData() {
        // Send data to the template
        // let data = game.JTCS.utils.getSettingValue("artGallerySettings");
        let data = this.data;
        this.data = await game.JTCS.utils.getSettingValue("artGallerySettings");

        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);
        html.off("click").on("click", "[data-action]", this._handleButtonClick.bind(this));
        this._handleChange();
    }

    async handleAction(event, actionType) {}

    async _handleChange() {
        let app = game.JTCSSettingsApp;
        $(`select, input[type='checkbox'], input[type='radio'], input[type='text']`).on(
            "change",
            async function (event) {
                let { value, name, checked, type } = event.currentTarget;
                let propertyString = "";
                switch (type) {
                    case "select":
                    case "radio":
                        //the radio or select data is nested in a parent object that holds both its choices and the chosen value
                        //so we will want to get that parent object instead of the object itself
                        propertyString = name.split(".").splice(0, 2).join(".");
                        break;
                    case "checkbox":
                        value = checked; //if its a checkbox, set its value to whether or not it is checked
                    default:
                        propertyString = name;
                        break;
                }
                let settingsObject = getProperty(artGalleryDefaultSettings, propertyString);
                if (settingsObject && settingsObject.hasOwnProperty("onChange")) {
                    let ourApp = game.JTCSSettingsApp;
                    settingsObject.onChange(event, { value: value, app: ourApp, html: ourApp.element });
                }
            }
        );
    }

    async _handleButtonClick(event) {
        let clickedElement = $(event.currentTarget);
        if (clickedElement[0].type === "submit") {
            return;
        } else {
            console.log(clickedElement[0]);
        }
        event.stopPropagation();
        event.preventDefault();
        let action = clickedElement.data().action;
        let type = clickedElement.data().type;
        let name = clickedElement.data().displayName;

        switch (action) {
            case "add":
                //create
                break;
            case "open":
                //read
                break;
            case "edit":
                //update
                break;
            case "delete":
                //delete
                break;
        }
    }

    async _updateObject(event, formData) {
        //right now, setting key for colors is like --- indicatorColorData.colors.artTileColor
        await game.JTCS.utils.setSettingValue("artGallerySettings", formData, "", true);
    }
}

window.JTCSSettingsApplication = JTCSSettingsApplication;
