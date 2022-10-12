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
            capitalizedString = sentenceArray
                .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
                .join(" ");
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
        await HelperFunctions.setSettingValue(
            "artGallerySettings",
            artGalleryDefaultSettings,
            "",
            true
        );
        // await game.settings.set(MODULE_ID, "artGallerySettings", newSettings);
    }
    static async swapTools(layerName = "background", tool = "select") {
        if (game.version >= 10) {
            if ((layerName = "background")) layerName = "tiles";
        }
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
    /**
     * Scale a tile's size, or one dimension (length or width) of a tile
     * @param {Number} scale - the ratio to scale the tile by
     * @param {String} axis - the tile's width or the tile's height or both
     */
    static async scaleControlledTiles(scale = 0.5, axis = " ") {
        const ourScene = game.scenes.viewed;

        const sceneTiles = canvas.background.controlled.filter(
            (obj) => obj.document.documentName === "Tile"
        );

        let updateObjects = [];

        sceneTiles.forEach((tile) => {
            let width = duplicate(tile.data.width);
            let height = duplicate(tile.data.height);
            height *= scale;
            width *= scale;
            updateObjects.push({
                _id: tile.id,
                ...(axis === " " && { height: height, width: width }),
                ...(axis === "height" && { height: height }),
                ...(axis === "width" && { width: width }),
            });
        });
        ourScene.updateEmbeddedDocuments("Tile", updateObjects);
    }

    // Move tiles
    // originally By @cole$9640
    //slightly edited by @Eva into a modular method
    static async moveControlledTiles(amount = 10, axis = "x") {
        const ourScene = game.scenes.viewed;

        const tiles =
            canvas.background.controlled.length === 0
                ? canvas.foreground.controlled
                : canvas.background.controlled;
        if (tiles.length) {
            const updates = tiles
                .filter((tile) => !tile.data.locked)
                .map((tile) => ({
                    _id: tile.id,
                    [axis]: tile[axis] + amount,
                }));
            ourScene.updateEmbeddedDocuments("Tile", updates);
        } else {
            ui.notifications.notify("Please select at least one tile.");
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
    static async setSettingValue(
        settingName,
        updateData,
        nestedKey = "",
        isFormData = false
    ) {
        if (isFormData) {
            let currentSettingData = game.settings.get(
                HelperFunctions.MODULE_ID,
                settingName
            );
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

    /* --------------------------------- Colors --------------------------------- */
    /**
     *
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
    /**
     * Will return 1 if color is darker than gray, -1 if color is lighter than gray
     * @param {String} hexColor - string hex color
     * @returns {Number} -1 or +1
     */
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

        const contrastValue = HF.getContrastBetween(backgroundColor, accentColor);
        const direction = contrastValue > 0 ? 1 : -1;
        // const text = contrastValue < 0 ? "We should darken color" : "we should lighten color";
        let adjustedColor = HF.hex8To6(accentColor);

        for (
            let adjustAmount = 0, times = 0;
            times < 15;
            adjustAmount += direction * 10, times += 1
        ) {
            adjustedColor = HF.LightenDarkenColor(accentColor, adjustAmount);
            // console.log(
            //     `%c Adjusted color by ${adjustAmount}. New Color is ${adjustedColor}`,
            //     `color: ${adjustedColor}`
            // );
            const hasEnoughContrast = HF.checkIfColorsContrastEnough(
                backgroundColor,
                adjustedColor
            );
            if (hasEnoughContrast) {
                break;
            }
        }
        // for (let adjustAmount = 0; adjustAmount < 255; adjustAmount += direction * 10) {
        //     adjustedColor = HF.LightenDarkenColor(accentColor, adjustAmount);
        //     const hasEnoughContrast = HF.checkIfColorsContrastEnough(backgroundColor, adjustedColor);
        //     if (hasEnoughContrast) {
        //         break;
        //     }
        // }

        return adjustedColor;
    }

    static getContrastBetween(backgroundColor, accentColor) {
        const HF = HelperFunctions;
        let contrast1 = HF.getContrast(backgroundColor);
        let contrast2 = HF.getContrast(accentColor);
        //the 128 is like a value between 0 and 255, so gray.
        //if luminance? is grater than 128, it's between gray and white, so return a dark color
        //if luminance? is less than 128, it's between black and gray, so return a light color
        let contrastBetween = contrast2 - contrast1;
        return contrastBetween;
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
        var string = "000000" + (g | (b << 8) | (r << 16)).toString(16);
        return (usePound ? "#" : "") + string.substring(string.length - 6);
        // return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16);
    }

    /**
     * set the custom colors for the indicators and color scheme in the JTCS Apps
     * @param {String} settingPropertyString - the string name of the property in the settings
     */
    static async getColorDataFromSettings(settingPropertyString) {
        const HF = HelperFunctions;
        let colorData = await HelperFunctions.getSettingValue(
            "artGallerySettings",
            settingPropertyString
        );
        let { colors, propertyNames, colorVariations } = colorData;

        Object.keys(colors).forEach((colorKey) => {
            const value = HF.hex8To6(colors[colorKey]);
            const propertyName = propertyNames[colorKey];
            let shouldMakeVariants = false;
            if (colorVariations) {
                shouldMakeVariants = colorVariations[colorKey];
            }
            HF.setRootStyleProperty(propertyName, value, shouldMakeVariants);
        });

        // add these extra bits on for now
        if (settingPropertyString === "colorSchemeData") {
            let { accentColor, backgroundColor } = colors;

            // accentColor = accentColor;//HF.getColorWithContrast(backgroundColor, accentColor);
            backgroundColor = HF.hex8To6(backgroundColor);

            const colorNeutral =
                HF.getContrast(backgroundColor) >= 128 ? "black" : "white";
            const textColor = HF.getContrast(accentColor) >= 128 ? "black" : "white";

            HF.setRootStyleProperty("--JTCS-text-color-on-bg", colorNeutral); //for text on the background color
            HF.setRootStyleProperty("--JTCS-text-color-on-fill", textColor); //for text on buttons and filled labels

            HF.setRootStyleProperty("--JTCS-accent-color", accentColor); //HF.getColorWithContrast(backgroundColor, accentColor));
        }
    }
    /**
     * set the custom colors for the indicators and color scheme in the JTCS Apps
     */
    static async setUIColors() {
        await this.getColorDataFromSettings("indicatorColorData");
        await this.getColorDataFromSettings("colorSchemeData");
    }

    /**
     * Set properties of custom colors on root element for use in our CSS
     * @param {String} propertyName - the name of the CSS custom property we want to set on the root element
     * @param {String} value - a value representing a hex code color
     * @param {*} makeVariations  - whether we should generate light and dark variants on this color for better contrast
     */
    static setRootStyleProperty(propertyName, value, makeVariations = false) {
        const html = document.documentElement;
        const HF = HelperFunctions;
        value = HF.hex8To6(value);

        html.style.setProperty(propertyName, value);

        if (makeVariations) {
            const direction = HF.lighterOrDarker(value);
            const shouldDarken = direction < 0 ? true : false;
            const text =
                direction < 0 ? "We should darken color" : "we should lighten color";
            console.log(text);

            let startNumber = !shouldDarken ? 80 : 0;
            let step = !shouldDarken ? -10 : 10;

            for (var number = startNumber; Math.abs(number) < 90; number += step) {
                const variantPropName = `${propertyName}-${number
                    .toString()
                    .padStart(2, "0")}`;
                // const amount = number;
                const amount = shouldDarken ? number * -1 : number;
                const variantValue = HF.LightenDarkenColor(value, amount);
                html.style.setProperty(variantPropName, variantValue);
            }
            if (propertyName.includes("background-color")) {
                const htmlStyle = getComputedStyle(html);
                let inputBG = htmlStyle.getPropertyValue("--JTCS-background-color");
                let elevationBG = htmlStyle.getPropertyValue("--JTCS-background-color");
                let borderColor = htmlStyle.getPropertyValue(
                    "--JTCS-background-color-70"
                );
                let shadowColor = htmlStyle.getPropertyValue(
                    "--JTCS-background-color-50"
                );
                let dangerColor = htmlStyle.getPropertyValue("--color-danger-base");
                let warningColor = htmlStyle.getPropertyValue("--color-warning-base");
                let infoColor = htmlStyle.getPropertyValue("--color-info-base");
                let successColor = htmlStyle.getPropertyValue("--color-success-base");
                let tileItemColor = "transparent";
                if (!shouldDarken) {
                    inputBG = getComputedStyle(html).getPropertyValue(
                        "--JTCS-background-color-20"
                    );
                    borderColor = "transparent"; //getComputedStyle(html).getPropertyValue("--JTCS-background-color");
                    shadowColor = "transparent";
                    elevationBG = htmlStyle.getPropertyValue(
                        "--JTCS-background-color-10"
                    );
                    dangerColor = htmlStyle.getPropertyValue("--color-danger-light");
                    dangerColor = htmlStyle.getPropertyValue("--color-danger-light");
                    infoColor = htmlStyle.getPropertyValue("--color-info-light");
                    successColor = htmlStyle.getPropertyValue("--color-success-light");
                    tileItemColor = elevationBG;
                }
                html.style.setProperty("--JTCS-box-shadow-color", shadowColor);
                html.style.setProperty("--JTCS-input-background-color", inputBG);
                html.style.setProperty("--JTCS-border-color", borderColor);
                html.style.setProperty("--JTCS-elevation-BG-color", elevationBG);
                html.style.setProperty("--JTCS-danger-color", dangerColor);
                html.style.setProperty("--JTCS-warning-color", warningColor);
                html.style.setProperty("--JTCS-info-color", dangerColor);
                html.style.setProperty("--JTCS-success-color", warningColor);
                html.style.setProperty("--JTCS-tile-item-bg-color", tileItemColor);
            }
        }
    }

    /**
     * Checks if color is in hex8 format, and if so slices string to make it hex6
     * @param {String} hexColor - a hex color code with "#" up front
     * @returns {String}
     */
    static hex8To6(hexColor) {
        let hexColorMod = hexColor;
        if (hexColor.slice(1).length > 6) {
            hexColorMod = hexColor.slice(0, -2);
        }
        return hexColorMod;
    }
    static async getSettingValue(settingName, nestedKey = "") {
        let settingData = await game.settings.get(HelperFunctions.MODULE_ID, settingName);
        if (settingData !== undefined && settingData !== null) {
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
        let options = {};
        let d = new Dialog({
            title: "Welcome Message",
            content: `<div><p>
			<h2>Journal To Canvas Slideshow Has Updated</h2>
            <p>Journal to Canvas Slideshow is now known as "JTCS - Art Gallery"</p>
            <p>The module has received a huge overhaul, updates and improvements to preexisting features, and the addition of brand new features. 
           </p>
            <video width="100%" controls> 
            <source src="https://user-images.githubusercontent.com/13098820/193938899-f5920be7-6148-4ac7-9738-8a5ee7d420e9.mp4"
            type="video/mp4"/>
            Feature demo</video>
			    <ol style="list-style-type:decimal">
                <li>
                    <a href="https://github.com/EvanesceExotica/Journal-To-Canvas-Slideshow/blob/master/features-and-walkthrough.md">
                    View a detailed guide and walkthrough of the new features here
                    </a>
                </li>
                <li><a href="https://github.com/EvanesceExotica/Journal-To-Canvas-Slideshow/blob/master/README.md">ReadMe and Feature List</a></li>
                <li><a href="https://github.com/EvanesceExotica/Journal-To-Canvas-Slideshow/blob/master/release-notes.md">Release Notes</a></li>
			</ol>
		</p>
		<p>Note: This welcome message can be turned on and off in the module settings, but will be enabled after updates to inform you of important changes.</p>
		</div> `,
            buttons: {
                disable: {
                    label: "Disable Welcome Message",
                    callback: async () => await HelperFunctions.disableWelcomeMessage(),
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

    static isOutsideClick(event) {
        if ($(event.target).closest(".popover").length) {
            //click was on the popover
            return false;
        }
        //if our click is outside of our popover element
        return true;
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
    static async createEventActionObject(
        name,
        callback,
        shouldRenderAppOnAction = false
    ) {
        return {
            name: name,
            callback: callback,
            shouldRenderAppOnAction: shouldRenderAppOnAction,
        };
    }

    static editorsActive(sheet) {
        let hasActiveEditors = Object.values(sheet.editors).some(
            (editor) => editor.active
        );
        return hasActiveEditors;
    }
    ///
}
