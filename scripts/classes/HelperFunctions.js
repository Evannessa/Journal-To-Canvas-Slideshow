export class HelperFunctions {
    static MODULE_ID = "journal-to-canvas-slideshow";
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
    static async setSettingValue(settingName, settingValue) {
        await game.settings.set(HelperFunctions.MODULE_ID, settingName, settingValue);
    }

    static async getSettingValue(settingName) {
        let settingValue = game.settings.get(HelperFunctions.MODULE_ID, settingName);
        if (settingValue) {
            return settingValue;
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

    static async createDialog() {
        const options = {
            width: 600,
            height: 250,
        };
        let myContent = function (val) {
            return `<p>Create display and bounding tiles, set url image, and/or select which display location you'd like to use</p>
		 <form>
			<div class="form-group">
			  <label>Set url image</label>
			  <input type='text' name='inputField' value=${val}></input>
			</div>
		  </form>`;
        };

        let d = new Dialog(
            {
                title: "Slideshow Config",
                content: myContent(""),
                buttons: {
                    applyURLImage: {
                        label: "Set URL Image",
                        icon: "<i class='fa fa-eye'></i>",
                        callback: (html) => {
                            let result = html.find("input[name='inputField']");
                            if (result.val() !== "") {
                                determineLocation(null, result.val());
                                d.data.content = myContent(result.val());
                                d.render(true);
                            }
                        },
                    },
                    displayScene: {
                        label: "Use Display Scene",
                        icon: '<i class="fas fa-exchange-alt"></i>',
                        callback: (html) => {
                            setDisplayLocationInSettings("displayScene");
                            let result = html.find("input[name='inputField']");
                            d.data.content = myContent(result.val());
                            d.render(true);
                        },
                    },
                    anyScene: {
                        label: "Use Any Scene With Bounding Tile",
                        icon: '<i class="fas fa-exchange-alt"></i>',
                        callback: (html) => {
                            setDisplayLocationInSettings("anyScene");
                            let result = html.find("input[name='inputField']");
                            d.data.content = myContent(result.val());
                            d.render(true);
                        },
                    },
                    window: {
                        label: "Use Window",
                        icon: '<i class="fas fa-exchange-alt"></i>',
                        callback: (html) => {
                            setDisplayLocationInSettings("window");
                            let result = html.find("input[name='inputField']");
                            d.data.content = myContent(result.val());
                            d.render(true);
                        },
                    },
                    createDisplayTile: {
                        label: "Create Display Tile",
                        icon: "<i class='far fa-image'></i>",
                        callback: (html) => {
                            createDisplayTile(game.scenes.viewed);
                            let result = html.find("input[name='inputField']");
                            d.data.content = myContent(result.val());
                            d.render(true);
                        },
                    },
                    createBoundingTile: {
                        label: "Create Bounding Tile",
                        icon: "<i class='far fa-square'></i>",
                        callback: (html) => {
                            createBoundingTile();
                            let result = html.find("input[name='inputField']");
                            d.data.content = myContent(result.val());
                            d.render(true);
                        },
                    },
                },
            },
            options
        ).render(true);
    }
}
Handlebars.registerHelper("combineToString", function (...args) {
    args.pop();
    let sentence = args.join(" ");
    return new Handlebars.SafeString(sentence);
});

Handlebars.registerHelper("ternary", function (test, yes, no) {
    return test ? yes : no;
});
