import { log, MODULE_ID } from "../debug-mode.js";
import { artGalleryDefaultSettings } from "../settings.js";
import { universalInterfaceActions as UIA } from "../data/Universal-Actions.js";
import { HelperFunctions as HF } from "./HelperFunctions.js";

const settingsActions = {
    global: {
        resetColors: {
            onClick: () => {},
        },
    },
    item: {},
};
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
            submitOnClose: false,
            closeOnSubmit: false,
            submitOnChange: false,
            template: `modules/${MODULE_ID}/templates/JTCS-settings-app.hbs`,
            id: "JTCSSettingsApplication",
            title: " JTCSSettings Application",
            scrollY: [".form-content"],
            onsubmit: (event) => {
                console.log("Submitting from", event.currentTarget.dataset.action);
            },
        });
    }

    async getData() {
        // Send data to the template
        // let data = game.JTCS.utils.getSettingValue("artGallerySettings");
        this.data = await game.JTCS.utils.getSettingValue("artGallerySettings");
        let data = this.data;
        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);

        html.off("click").on("click", "[data-action]", this._handleButtonClick.bind(this));
        this._handleChange();
    }

    async handleAction(event, actionType) {}

    async _handleChange() {
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
                        break;
                    case "text":
                        propertyString = name.split(".").splice(0, 1).join(".");
                        break;
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
        let action = clickedElement.data().action;
        let type = clickedElement[0].type;
        if (type === "submit") {
            this.element.find("form").on("submit", (e) => {
                if (action === "closeOnSubmit") {
                    this.close();
                }
            });

            return;
        }
        event.stopPropagation();
        event.preventDefault();

        let backgroundColor = this.element.find("#backgroundColor").val();
        let outerWrapper = clickedElement.closest(".outer-wrapper");

        const accentElement = outerWrapper.find("[data-responsive-color]");
        let accentColor = accentElement.val();

        let contrastNotification = outerWrapper.find(".inline-notification");

        if (action === "checkContrast") {
            let hasEnoughContrast = HF.checkIfColorsContrastEnough(backgroundColor, accentColor);
            if (!hasEnoughContrast && contrastNotification.length === 0) {
                await UIA.renderInlineNotification(event, "outer-wrapper", {
                    message:
                        "This color does not have enough contrast with the background color you've chosen. Text and buttons might be unreadable.",
                    notificationType: "warning",
                });
            } else if (hasEnoughContrast && contrastNotification.length > 0) {
                contrastNotification.remove();
            }
        } else if (action === "toggleAutoContrastOff") {
            const templatePath = game.JTCS.templates["delete-confirmation-prompt"];
            const buttons = {
                cancel: {
                    label: "Cancel",
                    icon: "<i class='fas fa-undo'></i>",
                },
                delete: {
                    label: "Turn Off Auto-Contrast",
                    icon: "<i class='fas fa-power-off'></i>",
                    callback: async () => {
                        await HF.setSettingValue("artGallerySettings", false, "colorSchemeData.autoContrast");
                        this.render(true);
                    },
                },
            };
            const data = {
                icon: "fas fa-exclamation",
                heading: "Turn off Auto-Contrast?",
                destructiveActionText: `Turn off auto contrast`,
                explanation: `This will make it so your chosen colors aren't automatically adjusted to contrast with your background color; 
                <br/> However you risk choosing colors that make text illegible`,
                buttons,
            };
            await HF.createDialog("Turn Off Auto Contrast", templatePath, data);
        } else if (action === "toggleAutoContrastOn") {
            await HF.setSettingValue("artGallerySettings", true, "colorSchemeData.autoContrast");
            this.render(true);
        } else if (action === "resetColor") {
            let key = accentElement.attr("name");
            let defaultValue = getProperty(artGalleryDefaultSettings, key);
            await HF.setSettingValue("artGallerySettings", defaultValue, key);
            this.render(true);
            // accentElement.val(defaultValue);
        }
    }

    async _updateObject(event, formData) {
        const autoContrast = await HF.getSettingValue("artGallerySettings", "colorSchemeData.autoContrast");
        if (autoContrast) {
            //if auto-contrast is turned on
            const bgColorKey = "colorSchemeData.colors.backgroundColor";
            for (const key in formData) {
                if (key.includes(".colors.") && !key.includes(bgColorKey)) {
                    //for all the colors, convert the colors
                    // console.log("Before", key, formData[key]);
                    const bgColor = formData[bgColorKey];
                    const fgColor = formData[key];
                    const hasEnoughContrast = HF.checkIfColorsContrastEnough(bgColor, fgColor);
                    //only alter the contrast if there isn't enough already
                    if (!hasEnoughContrast) {
                        formData[key] = HF.getColorWithContrast(bgColor, fgColor);
                    }
                    // console.log("after", key, formData[key]);
                }
            }
        }

        // await HF.setSettingValue("artGallerySettings", )
        await game.JTCS.utils.setSettingValue("artGallerySettings", formData, "", true);
        await game.JTCSSettingsApp.render(true);
    }
}

window.JTCSSettingsApplication = JTCSSettingsApplication;
