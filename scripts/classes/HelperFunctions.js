import { log, MODULE_ID } from "../debug-mode.js";
import { artGalleryDefaultSettings } from "../settings.js";
export class HelperFunctions {
    static MODULE_ID = "journal-to-canvas-slideshow";

    /**
     * pass in a string and capitalize each word in the string
     * @param {String} string - the string whose words we want to capitalize
     * @param {String} delimiter - a delimiter separating each word
     * @returns A string with each word capitalized and the same delimiters
     */
    static capitalizeEachWord(string, delimiter = " ") {
        let sentenceArray;
        let capitalizedString;

        if (!delimiter) {
            // if the delimiter is an empty string, split it by capital letters, as if camelCase
            sentenceArray = string.split(/(?=[A-Z])/).map((s) => s.toLowerCase());
            capitalizedString = sentenceArray.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" ");
        } else {
            sentenceArray = string.split(delimiter);

            capitalizedString = sentenceArray
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(delimiter);
        }
        return capitalizedString;
    }
    static async resetArtGallerySettings() {
        await HelperFunctions.setSettingValue("artGallerySettings", {}, "", false);
        await HelperFunctions.setSettingValue("artGallerySettings", artGalleryDefaultSettings, "", true);
        // await game.settings.set(MODULE_ID, "artGallerySettings", newSettings);
    }
    static async swapTools(layerName = "background", tool = "select") {
        ui.controls.controls.find((c) => c.layer === layerName).activeTool = tool;

        let ourLayer = game.canvas.layers.find((l) => l.options.name === layerName);
        if (ourLayer) {
            if (ourLayer && !ourLayer.active) {
                ourLayer?.activate();
            } else {
                ui.controls.render(true);
            }
        } else {
            console.error("Can't find that layer", ourLayer);
        }
    }

    static async setFlagValue(document, flagName, updateData, nestedKey = "") {
        await document.setFlag(MODULE_ID, flagName, updateData);
    }
    /**
     * Get the value of a document's flag
     * @param {Object} document - the document whose flags we want to set (Scene, Actor, Item, etc)
     * @param {String} flagName - the name of the flag
     * @param {String} nestedKey - a string of nested properties separated by dot notation that we want to set
     * @param {*} returnIfEmpty - a value to return if the flag is undefined
     * @returns
     */
    static async getFlagValue(document, flagName, nestedKey = "", returnIfEmpty = []) {
        let flagData = await document.getFlag(MODULE_ID, flagName);
        if (!flagData) {
            flagData = returnIfEmpty;
        }
        return flagData;
    }

    /**
     *  Sets a value, using the "flattenObject" and "expandObject" utilities to reach a nested property
     * @param {String} settingName - the name of the setting
     * @param {*} updateData - the value you want to set a property to
     * @param {String} nestedKey - a string of dot-separated values to refer to a nested property
     */
    static async setSettingValue(settingName, updateData, nestedKey = "", isFormData = false) {
        if (isFormData) {
            let currentSettingData = game.settings.get(HelperFunctions.MODULE_ID, settingName);
            updateData = expandObject(updateData); //get expanded object version of formdata keys, which were strings in dot notation previously
            updateData = mergeObject(currentSettingData, updateData);
            // let updated = await game.settings.set(HelperFunctions.MODULE_ID, settingName, currentSettingData);
            // console.warn(updated);
        }
        if (nestedKey) {
            let settingData = game.settings.get(HelperFunctions.MODULE_ID, settingName);
            setProperty(settingData, nestedKey, updateData);
            await game.settings.set(HelperFunctions.MODULE_ID, settingName, settingData);
        } else {
            await game.settings.set(HelperFunctions.MODULE_ID, settingName, updateData);
        }
    }
    /**
     * Get the contrasting color for any hex color
     * (c) 2019 Chris Ferdinandi, MIT License, https://gomakethings.com
     * Derived from work by Brian Suda, https://24ways.org/2010/calculating-color-contrast/
     * @param  {String} A hexcolor value
     * @return {String} The contrasting color (black or white)
     **/
    static getContrast(hexcolor) {
        // If a leading # is provided, remove it
        if (hexcolor.slice(0, 1) === "#") {
            hexcolor = hexcolor.slice(1);
        }

        // If a three-character hexcode, make six-character
        if (hexcolor.length === 3) {
            hexcolor = hexcolor
                .split("")
                .map(function (hex) {
                    return hex + hex;
                })
                .join("");
        }

        // Convert to RGB value
        var r = parseInt(hexcolor.substr(0, 2), 16);
        var g = parseInt(hexcolor.substr(2, 2), 16);
        var b = parseInt(hexcolor.substr(4, 2), 16);

        // Get YIQ ratio
        var yiq = (r * 299 + g * 587 + b * 114) / 1000;

        // Check contrast
        //@author: slightly modified this
        return yiq; // >= 128 ? "black" : "white";
        // return yiq >= 128 ? "black" : "white";
    }
    static lighterOrDarker(hexColor) {
        const HF = HelperFunctions;
        let yiq = HF.getContrast(hexColor);
        //the 128 is like a value between 0 and 255, so gray
        //checking to see if the contrast value is greater than gray (black) or less than gray (white)
        return yiq >= 128 ? -1 : 1;
    }
    /**
     *
     * @param {String} backgroundColor - our background color
     * @param {String} accentColor - the color we're adjusting to find a tint with better contrast
     * @returns a color lightened to have the right contrast
     */
    static getColorWithContrast(backgroundColor, accentColor) {
        const HF = HelperFunctions;

        backgroundColor = HF.hex8To6(backgroundColor);
        accentColor = HF.hex8To6(accentColor);

        let direction = HF.lighterOrDarker(accentColor);
        let adjustedColor = HF.hex8To6(accentColor);

        for (let adjustAmount = 0; adjustAmount < 100; adjustAmount += direction * 10) {
            console.log("Adjust amount", adjustAmount, "Direction is", direction);
            adjustedColor = HF.LightenDarkenColor(accentColor, adjustAmount);
            const hasEnoughContrast = HF.checkIfColorsContrastEnough(backgroundColor, adjustedColor);
            console.log("Has enough contrast?", backgroundColor, adjustedColor, hasEnoughContrast);
            if (hasEnoughContrast) {
                break;
            }
        }
        return adjustedColor;
    }

    static checkIfColorsContrastEnough(hexColor1, hexColor2) {
        const HF = HelperFunctions;
        let contrast1 = HF.getContrast(hexColor1);
        let contrast2 = HF.getContrast(hexColor2);
        //the 128 is like a value between 0 and 255, so gray.
        //if luminance? is grater than 128, it's between gray and white, so return a dark color
        //if luminance? is less than 128, it's between black and gray, so return a light color
        let contrastBetween = Math.abs(contrast2 - contrast1);
        return contrastBetween >= 128 ? true : false;
    }

    /**
     * Programmatically lighten or darken a color
     * @author "Pimp Trizkit" on Stackoverflow
     * @link https://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color-or-rgb-and-blend-colors
     * @returns a lightened or darkened color
     */
    static LightenDarkenColor(col, amt) {
        var usePound = false;
        if (col[0] == "#") {
            col = col.slice(1);
            usePound = true;
        }

        var num = parseInt(col, 16);

        var r = (num >> 16) + amt;

        if (r > 255) r = 255;
        else if (r < 0) r = 0;

        var b = ((num >> 8) & 0x00ff) + amt;

        if (b > 255) b = 255;
        else if (b < 0) b = 0;

        var g = (num & 0x0000ff) + amt;

        if (g > 255) g = 255;
        else if (g < 0) g = 0;

        return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16);
    }

    /**
     * set the custom colors for the indicators and color scheme in the JTCS Apps
     * @param {String} settingPropertyString - the string name of the property in the settings
     */
    static async getColorDataFromSettings(settingPropertyString) {
        const HF = HelperFunctions;
        let colorData = await HelperFunctions.getSettingValue("artGallerySettings", settingPropertyString);
        let { colors, propertyNames, colorVariations } = colorData;

        Object.keys(colors).forEach((colorKey) => {
            const value = HF.hex8To6(colors[colorKey]);
            const propertyName = propertyNames[colorKey];
            // let shouldMakeVariants = false;
            // if (colorVariations) {
            //     shouldMakeVariants = colorVariations[colorKey];
            // }
            HF.setRootStyleProperty(propertyName, value);
        });

        // add these extra bits on for now
        if (settingPropertyString === "colorSchemeData") {
            let { accentColor, backgroundColor } = colors;
            HF.setRootStyleProperty("--JTCS-color-neutral", HF.getContrast(HF.hex8To6(backgroundColor)));
            HF.setRootStyleProperty("--JTCS-text-color", HF.getContrast(HF.hex8To6(accentColor)));
            HF.setRootStyleProperty("--JTCS-accent-color", HF.getColorWithContrast(backgroundColor, accentColor));

            console.log(
                "Contrast good?",
                HF.checkIfColorsContrastEnough(HF.hex8To6(accentColor), HF.hex8To6(backgroundColor))
            );
        }
    }
    /**
     * set the custom colors for the indicators and color scheme in the JTCS Apps
     */
    static async setUIColors() {
        let html = document.documentElement;

        await this.getColorDataFromSettings("indicatorColorData");
        await this.getColorDataFromSettings("colorSchemeData");
        // let galleryTileColorData = await HelperFunctions.getSettingValue("artGallerySettings", "indicatorColorData");
        // let { colors, propertyNames } = galleryTileColorData;
        // Object.keys(colors).forEach((colorKey) => {
        //     const value = colors[colorKey];
        //     const propertyName = propertyNames[colorKey];
        //     console.log(colorKey, value, propertyName);
        //     HelperFunctions.setRootStyleProperty(propertyName, value);
        // });

        // let { frameTileColor, artTileColor, unlinkedTileColor, defaultTileColor } = galleryTileColorData;

        // // tile colors
        // html.style.setProperty("--data-frame-color", frameTileColor);
        // html.style.setProperty("--data-art-color", artTileColor);
        // html.style.setProperty("--data-unlinked-color", unlinkedTileColor);
        // html.style.setProperty("--data-default-color", defaultTileColor);

        // let colorSchemeData = await HelperFunctions.getSettingValue("artGallerySettings", "colorSchemeData");
        // let { colors, propertyNames } = galleryTileColorData;
        // Object.keys(colors).forEach((colorKey) => {
        //     const value = colors[colorKey];
        //     const propertyName = propertyNames[colorKey];
        //     console.log(colorKey, value, propertyName);
        //     HelperFunctions.setRootStyleProperty(propertyName, value);
        // });

        // let { accentColor, textColor, textColorAlt, backgroundColor } = colorSchemeData;

        // html.style.setProperty("--JTCS-accent-color", accentColor);
        // html.style.setProperty("--JTCS-text-color", HelperFunctions.getContrast(accentColor));
        // html.style.setProperty("--JTCS-background-color", backgroundColor);

        // let bgColorModified = HelperFunctions.hex8To6(backgroundColor);
        // let accentColorModified = HelperFunctions.hex8To6(backgroundColor);

        // html.style.setProperty(
        //     "--JTCS-accent-color-light",
        //     HelperFunctions.LightenDarkenColor(accentColorModified, 20)
        // );

        // html.style.setProperty(
        //     "--JTCS-background-color-light",
        //     HelperFunctions.LightenDarkenColor(bgColorModified, 20)
        // );
        // html.style.setProperty("--JTCS-background-color-dark", HelperFunctions.LightenDarkenColor(bgColorModified, -5));
        // html.style.setProperty("--JTCS-color-neutral", HelperFunctions.getContrast(backgroundColor));
    }

    /**
     * Set properties of custom colors on root element for use in our CSS
     * @param {String} propertyName - the name of the CSS custom property we want to set on the root element
     * @param {String} value - a value representing a hex code color
     * @param {*} makeVariations  - whether we should generate light and dark variants on this color for better contrast
     */
    static setRootStyleProperty(propertyName, value, makeVariations = false) {
        const html = document.documentElement;
        html.style.setProperty(propertyName, value);
        if (makeVariations) {
            const lightVariantPropName = `${propertyName}-light`;
            const lightVariantValue = HelperFunctions.LightenDarkenColor(value, 20);
            const darkVariantPropName = `${propertyName}-dark`;
            const darkVariantValue = HelperFunctions.LightenDarkenColor(value, -10);
            html.style.setProperty(lightVariantPropName, lightVariantValue);
            html.style.setProperty(darkVariantPropName, darkVariantValue);
        }
    }

    /**
     * Checks if color is in hex8 format, and if so slices string to make it hex6
     * @param {String} hexColor - a hex color code with "#" up front
     * @returns {String}
     */
    static hex8To6(hexColor) {
        console.log(hexColor);
        let hexColorMod = hexColor;
        if (hexColor.slice(1).length > 6) {
            hexColorMod = hexColor.slice(0, -2);
        }
        return hexColorMod;
    }
    static async getSettingValue(settingName, nestedKey = "") {
        let settingData = await game.settings.get(HelperFunctions.MODULE_ID, settingName);
        if (settingData) {
            if (nestedKey) {
                let nestedSettingData = getProperty(settingData, nestedKey);

                return nestedSettingData;
            }
            return settingData;
        } else {
            console.error("Cannot find setting with name " + settingName);
        }
    }

    static async checkSettingEquals(settingName, compareToValue) {
        if (game.settings.get(HelperFunctions.MODULE_ID, settingName) == compareToValue) {
            return true;
        }
        return false;
    }

    static async showWelcomeMessage() {
        let d = new Dialog({
            title: "Welcome Message",
            content: `<div><p>
			<h2>Journal To Canvas Slideshow Has Updated</h2>
			<ol style="list-style-type:decimal">
				<li><a href="https://youtu.be/t4NX55vs9gU">Watch the tutorial video here</a></li><br>
				<li>Please check the module's settings and reselect your prefered options, as the settings have changed</li><br>
				<li>Please recreate your Display Scene, or replace the tile in your display scene with a "Display Tile" (see tutorial video for how-to)</li><br>
				<li>Please create all Display Tiles from now on using the "Create Display Tile" button under the Tile controls.</li><br>
				<li>Note that Display Tiles now are "flagged" by the script and no longer need to be the very first tile in the scene, so you can add it after other tiles</li><br>
			</ol>
		</p>
		<p>The welcome message can be turned on and off in the module settings, but will be enabled after updates to inform you of important changes.</p>
		</div> `,
            buttons: {
                disable: {
                    label: "Disable Welcome Message",
                    callback: DisableWelcomeMessage,
                },
                continue: {
                    label: "Continue without Disabling",
                },
            },
        });
        d.render(true);
    }

    static async disableWelcomeMessage() {
        //disable the welcome message
        await HelperFunctions.setSettingValue("showWelcomeMessage", false);
    }
    static isImage(url) {
        return /\.(jpg|jpeg|png|webp|avif|gif|svg)$/.test(url);
    }
    /**
     * Validating text input
     * @param {String} inputValue - the input value
     * @param {string} validationType - the type of input, what are we looking for, an image, video, etc.
     * @param {function} onInvalid - callback function for if our input is invalid
     * @returns true or false depending on if our input is valid or not
     */

    static validateInput(inputValue, validationType, onInvalid = "") {
        let valid = false;
        switch (validationType) {
            case "image":
                valid = HelperFunctions.isImage(inputValue);
                break;
            default:
                valid = inputValue !== undefined;
                break;
        }
        return valid;
    }

    static getElementPositionAndDimension(element) {
        return {};
    }

    /**
     * Generates a popover (tooltip, etc), and positions it from the source element
     * boundingClientRect data
     * @param {Object} templateData - the data to be passed to the popover
     * @param {Application} parentApp - the parent application rendering the popover
     * @param {HTMLElement} sourceElement - the element that is the "source" of the popover (a button, input, etc.)
     */
    static async createAndPositionPopover(templateData, elementDataArray = []) {
        let elements = elementDataArray.map((data) => data.target);
        let [popoverElement, sourceElement, parentElement] = elements; //destructure the passed-in elements

        let boundingRect = sourceElement.getBoundingClientRect();

        let popoverTemplate = game.JTCS.templates["popover"];
        popoverElement = parentElement.find(".popover");
        if (!popoverElement.length) {
            //if it doesn't already exist, create it
            let renderedHTML = await renderTemplate(popoverTemplate, templateData);
            parentElement.append(renderedHTML);
            popoverElement = parentElement.find(".popover");
        }

        let popoverData = elementDataArray.find((data) => data.name === "popoverElement");
        popoverData.target = popoverElement;

        popoverElement.css({ position: "absolute" });

        popoverElement.offset({ top: boundingRect.top + boundingRect.height, left: boundingRect.left });

        popoverElement.focus({ focusVisible: true });

        //set up a "Click Out" event handler
        $(document)
            .off("click")
            .on("click", async (event) => {
                if (HelperFunctions.isOutsideClick(event)) {
                    await HelperFunctions.hideAndDeletePopover(popoverElement);
                }
            });

        //hideEvents should be list of events to hide the popover on (like blur, change, mouseout, etc)
        elementDataArray.forEach((data) => {
            let targetElement = data.target;
            data.hideEvents.forEach((eventData) => {
                let handler;
                let selector;
                let eventName;
                let options;
                if (typeof eventData === "string") {
                    //if it's a simple string, just set the handler to immediaetly hide the popover on this event
                    eventName = eventData;
                    handler = async (event) => await HelperFunctions.hideAndDeletePopover(popoverElement);
                    selector = "*";
                } else if (typeof eventData === "object") {
                    //if it's an object, we'll want to do something (like validate input) first before hiding
                    eventName = eventData.eventName;
                    options = {
                        ...eventData.options,
                        popover: popoverElement,
                        hideFunction: HelperFunctions.hideAndDeletePopover,
                    };
                    handler = async (event, options) => {
                        await eventData.wrapperFunction(event, options);
                        // if (proceed) {
                        // await HelperFunctions.hideAndDeletePopover(popoverElement);
                        // }
                    };
                    selector = eventData.selector;
                }
                $(targetElement)
                    .off(eventName)
                    .on(eventName, selector, async (event) => await handler(event, options));
            });
        });

        return popoverElement;
    }

    static isOutsideClick(event) {
        if ($(event.target).closest(".popover").length) {
            //click was on the popover
            return false;
        }
        //if our click is outside of our popover element
        return true;
    }

    static async hideAndDeletePopover(popoverElement) {
        // console.log("Hiding", popoverElement, popoverElement[0].isMouseOver);
        // popoverElement.addClass("hidden");
        //TODO: Put some sort of fading animation here
        if (popoverElement.timeout) {
            //if the popover is already counting down to a timeout, cancel it
            clearTimeout(popoverElement.timeout);
        }
        let popoverTimeout = setTimeout(() => {
            //set a new timeout to remove the popover
            popoverElement.remove();
        }, 900);
        //save that timeout's id on the popover
        popoverElement.timeout = popoverTimeout;
    }

    /**
     * Create a dialog
     * @param {String} title - the title of the dialog
     * @param {String} templatePath - the path to the template being used for this dialog
     * @param {Object} data - the data object
     * @param {Object} data.buttons - the buttons at the bottom of the prompt
     */
    static async createDialog(title, templatePath, data) {
        const options = {
            width: 600,
            // height: 250,
            id: "JTCS-custom-dialog",
        };
        let renderedHTML = await renderTemplate(templatePath, data);
        let d = new Dialog(
            {
                title: title,
                content: renderedHTML,
                buttons: data.buttons,
            },
            options
        ).render(true);
    }
    static async createEventActionObject(name, callback, shouldRenderAppOnAction = false) {
        return {
            name: name,
            callback: callback,
            shouldRenderAppOnAction: shouldRenderAppOnAction,
        };
    }

    static editorsActive(sheet) {
        let hasActiveEditors = Object.values(sheet.editors).some((editor) => editor.active);
        return hasActiveEditors;
    }
}
