import { MODULE_ID } from "../debug-mode.js";
/**
 * Form app to handle JTCS settings
 */
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
            closeOnSubmit: false,
            submitOnChange: true,
            template: `modules/${MODULE_ID}/templates/JTCS-settings-app.hbs`,
            id: "JTCSSettingsApplication",
            title: " JTCSSettings Application",
        });
    }

    getData() {
        // Send data to the template
        // let data = game.JTCS.utils.getSettingValue("artGallerySettings");
        let data = this.data;
        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);
        html.off("click").on("click", ["data-action"], this._handleButtonClick.bind(this));
        this._handleChange();
    }

    async _handleChange() {
        $(`select, input[type='checkbox'], input[type='radio'], input[type='text']`).on(
            "change",
            async function (event) {
                let { value, name, checked, type } = event.currentTarget;
                let clickedElement = $(event.currentTarget);
            }
        );
    }

    async _handleButtonClick(event) {
        let clickedElement = $(event.currentTarget);
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
        let expanded = expandObject(formData);
        console.log(formData, expanded);
        // game.JTCS.utils.setSettingValue("artGallerySettings", formData);
    }
}

window.JTCSSettingsApplication = JTCSSettingsApplication;
