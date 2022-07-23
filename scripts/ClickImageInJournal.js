import ImageVideoPopout from "../classes/MultiMediaPopout.js";
import { SlideshowConfig } from "./SlideshowConfig.js";
import { registerSettings } from "./settings.js";
import {
    convertBoundingTile,
    convertDisplayTile,
    getBoundingTiles,
    getSlideshowFlags,
    getTileDataFromFlag,
} from "./HooksAndFlags.js";
import { injectImageControls, getJournalImageFlagData, getSceneSpecificImageData } from "./ImageControls.js";

var displayScene;
var displayJournal;
var journalImage;

function findDisplayJournal() {
    let journalEntries = game.journal.contents;
    let foundDisplayJournal = false;
    journalEntries.forEach((element) => {
        //go through elements. If found, set bool to true. If not, it'll remain false. Return.
        if (element.name == "Display Journal") {
            displayJournal = element;
            foundDisplayJournal = true;
        }
    });
    return foundDisplayJournal;
}

async function createDisplayJournal() {
    //create a display journal
    if (!findDisplayJournal()) {
        displayJournal = await JournalEntry.create({
            name: "Display Journal",
        });
    } else {
        //if it already exists, render it and show to players
        displayJournal.render(false);
        if (displayJournal.data.img != "") {
            //if it's currentl on image mode
            displayJournal.show("image", true);
        } else {
            if (displayJournal.data.content != "") {
                displayJournal.show("text", true);
            }
        }
    }
}

export async function displayImageInWindow(method, url) {
    let displayName = game.settings.get("journal-to-canvas-slideshow", "displayName");
    //...
    // get the url from the image clicked in the journal
    //if popout doesn't exist
    if (method == "window") {
        //if we would like to display in a new popout window
        let popout = new ImageVideoPopout(url, {
            shareable: true,
        })
            .render(true)
            .shareImage();
    } else if (method == "journalEntry") {
        //if we would like to display in a dedicated journal entry

        if (!findDisplayJournal()) {
            //couldn't find display journal, so return
            ui.notifications.error(`No journal entry named ${displayName} found`);
            return;
        } else {
            displayJournal.render(true);
            // if (game.settings.get("journal-to-canvas-slideshow", "autoShowDisplay")) {
            //     //if we have the auto show display settings on, automatically show the journal after the button is clicked
            //     displayJournal.render(false, {});
            // }
        }
        var fileTypePattern = /\.[0-9a-z]+$/i;
        var fileType = url.match(fileTypePattern);
        let update;

        if (fileType == ".mp4" || fileType == ".webm") {
            // if the file type is a video
            let videoHTML = `<div style="height:100%; display: flex; flex-direction: column; justify-content:center; align-items:center;">
			<video width="100%" height="auto" autoplay loop>
  				<source src=${url} type="video/mp4">
  				<source src=${url} type="video/webm">
			</video>
			</div>
			`;

            update = {
                _id: displayJournal._id,
                content: videoHTML,
                img: "",
            };

            const updated = await displayJournal.update(update, {});
            displayJournal.show("text", true);
        } else {
            //change the background image to be the clicked image in the journal
            update = {
                _id: displayJournal.id,
                content: "",
                img: url,
            };
            const updated = await displayJournal.update(update, {});
            displayJournal.show("image", true);
        }
    }
}

export function getImageSource(imageElement, myCallback) {
    let type = imageElement.nodeName;
    let url;

    if (type == "IMG") {
        //if it's an image element
        url = imageElement.getAttribute("src");
    } else if (type == "VIDEO") {
        //if it's a video element
        url = imageElement.getElementsByTagName("source")[0].getAttribute("src");
    } else if (type == "DIV" && imageElement.classList.contains("lightbox-image")) {
        //if it's a lightbox image on an image-mode journal
        //https://stackoverflow.com/questions/14013131/how-to-get-background-image-url-of-an-element-using-javascript --
        let imgStyle = imageElement.style;
        url = imgStyle.backgroundImage.slice(4, -1).replace(/['"]/g, "");
    } else {
        ui.notifications.error("Type not supported");
        url = null;
    }
    if (myCallback) {
        //if my callback is defined
        myCallback(url);
    }
    return url;

    //load the texture from the source
}

function checkSettingEquals(settingName, compareToValue) {
    if (game.settings.get("journal-to-canvas-slideshow", settingName) == compareToValue) {
        return true;
    }
    return false;
}

export async function createDisplayTile(ourScene) {
    const tex = await loadTexture("/modules/journal-to-canvas-slideshow/artwork/DarkBackground.png");
    let dimensionObject = calculateAspectRatioFit(tex.width, tex.height, ourScene.data.width, ourScene.data.height);
    let newTile;
    newTile = await ourScene.createEmbeddedDocuments("Tile", [
        {
            img: "/modules/journal-to-canvas-slideshow/artwork/DarkBackground.png",
            width: dimensionObject.width,
            height: dimensionObject.height,
            x: 0,
            y: ourScene.data.height / 2 - dimensionObject.height / 2,
        },
    ]);
    convertDisplayTile(newTile.data);

    // newTile[0].setFlag("journal-to-canvas-slideshow", "name", "displayTile");
}

function checkMeetsDisplayRequirements(source, displayTile, boundingTile) {
    let doesMeetRequirements = true;

    //get the name of the scene or journal
    let displayName = game.settings.get("journal-to-canvas-slideshow", "displayName");
    if (!source) {
        ui.notifications.warn("Type not supported");
        doesMeetRequirements = false;
    }
    if (checkSettingEquals("displayLocation", "displayScene")) {
        if (!displaySceneFound()) {
            //if there is no display scene, return
            ui.notifications.error(`No display scene found. Please make sure you have a scene named ${displayName}`);
            doesMeetRequirements = false;
        }
    }
    if (!displayTile) {
        ui.notifications.error("No display tile found -- make sure your scene has a display tile");
        doesMeetRequirements = false;
    }
    if (!boundingTile) {
        //if the scene isn't the display scene but has a bounding Tile
        //the scene we're using is the currently viewed scene
        ui.notifications.error(
            "No bounding tile present in scene. Please use the display scene if you wish to display without a bounding tile"
        );
        doesMeetRequirements = false;
    }

    return doesMeetRequirements;
}

/**
 * Display the image in a tile, either in a dedicated displayScene, or on a displayTile in any scene
 * @param {HTML element} imageElement - the image element in the journal entry
 * @param {app} journalSheet - the "journal sheet" application which holds our entry
 * @param {String} externalURL - an external url, if we aren't getting the image source from a clicked image
 * @returns
 */
export async function displayImageInScene(imageElement, journalSheet, externalURL = "") {
    //get the flaggedTiles in this particular scene
    let flaggedTiles = await getSlideshowFlags();
    //get the image source from the event, or return the url if it's a url
    let url = externalURL ? externalURL : getImageSource(imageElement);

    //get the image data from the clicked image, and the journal entry itself
    let imageData = await getJournalImageFlagData(journalSheet.object, imageElement);
    let sceneSpecificData = await getSceneSpecificImageData(imageData);
    let selectedTileID = sceneSpecificData.selectedTileID;
    let displayTile = game.scenes.viewed.tiles.get(selectedTileID);

    console.log("Our display tile is", displayTile, flaggedTiles, imageData);

    //get the tile data from the selected tile id;
    let displayTileData = await getTileDataFromFlag(selectedTileID, flaggedTiles);
    let boundingTileID =
        displayTileData.linkedBoundingTile || flaggedTiles.filter((tileData) => tileData.isBoundingTile)[0].id;

    let boundingTile = game.scenes.viewed.tiles.get(boundingTileID);

    //if we're missing an image source, or any of the tiles, break out of this function
    if (!checkMeetsDisplayRequirements(url, displayTile, boundingTile)) {
        return;
    }

    await updateTileInScene(displayTile, boundingTile, game.scenes.viewed, url);

    //TODO: Rewrite auto-activate logic too
    // if (checkSettingEquals("autoShowDisplay", true)) {
    //     //if the settings have it set to automatically show the display, activate the scene
    //     await ourScene.activate();
    // }
}

async function updateTileInScene(displayTile, boundingTile, ourScene, url) {
    //load the texture from the source
    const tex = await loadTexture(url);
    var imageUpdate;

    if (!boundingTile) {
        imageUpdate = await scaleToScene(displayTile, tex, url);
    } else {
        imageUpdate = await scaleToBoundingTile(displayTile, boundingTile, tex, url);
    }

    const updated = await ourScene.updateEmbeddedDocuments("Tile", [imageUpdate]);
}

function createSceneButton(app, html) {
    if (!game.user.isGM) {
        //if the user isn't the GM, return
        return;
    }
    if (app.options.id == "scenes") {
        //if we're on the scenes tab, create a button to activate or generate the display scene when clicked
        let button = $("<button>Create or Show Display Scene</button>");
        //if the display scene already exists, open and activate it; if not, create a new one
        button.click(generateDisplayScene);
        html.find(".directory-footer").prepend(button);
    }
    if (app.options.id == "journal") {
        //create the journal button for generating a popout
        let button = $("<button>Create or Show Display Entry</button>");
        button.click(createDisplayJournal);
        html.find(".directory-footer").prepend(button);
    }
}

async function generateDisplayScene() {
    //create a Display" scene
    //set the scene to 2000 by 2000, and set the background color to a dark gray
    if (!displaySceneFound()) {
        displayScene = null;

        //create a new scene named display
        displayScene = await Scene.create({
            name: game.settings.get("journal-to-canvas-slideshow", "displayName"),
        });
        //activate the scene
        await displayScene.activate();
        //update the scene
        await displayScene.update({
            name: game.settings.get("journal-to-canvas-slideshow", "displayName"),
            width: 2000,
            height: 2000,
            backgroundColor: "#202020",
            padding: 0,
            gridType: 0,
        });

        //create a tile for the scene
        await createDisplayTile(displayScene);

        //this should refresh the canvas
        canvas.draw();
    } else {
        //if the display scene exits already, just activate it
        displayScene.activate();
    }
}

async function determineWhatToClear() {
    let location = game.settings.get("journal-to-canvas-slideshow", "displayLocation");
    if (location == "displayScene" || location == "anyScene") {
        clearDisplayTile();
    } else if (location == "window") {
        clearDisplayWindow();
    }
}

async function clearDisplayWindow() {
    if (!findDisplayJournal()) {
        return;
    }
    let url = "/modules/journal-to-canvas-slideshow/artwork/HD_transparent_picture.png";
    let update = {
        _id: displayJournal.id,
        img: url,
        content: `<div></div>`,
    };

    const updated = await displayJournal.update(update, {});
}

async function clearDisplayTile() {
    //clear a tile for the scene
    var displayTile = FindDisplayTile(game.scenes.viewed);
    if (!displaySceneFound() && displayTile == undefined) {
        //if we're not on the display scene and there's no display tile
        return;
    }
    var ourScene;
    if (game.settings.get("journal-to-canvas-slideshow", "displayLocation") == "displayScene") {
        ourScene = displayScene;
    } else {
        ourScene = game.scenes.viewed;
    }

    if (!displayTile) {
        ui.notifications.error("No display tile found -- make sure the display scene has a tile");
    }
    const tex = await loadTexture("/modules/journal-to-canvas-slideshow/artwork/HD_transparent_picture.png");

    var clearTileUpdate = {
        _id: displayTile.id,
        img: "/modules/journal-to-canvas-slideshow/artwork/HD_transparent_picture.png",
    };
    const updated = await ourScene.updateEmbeddedDocuments("Tile", [clearTileUpdate]);
}

function displaySceneFound() {
    let displayName = game.settings.get("journal-to-canvas-slideshow", "displayName");
    return game.scenes.contents.find((scene) => scene.name === displayName);
}

// V Used snippet from the below stackOverflow answer to help me with proportionally resizing the images
/*https://stackoverflow.com/questions/3971841/how-to-resize-images-proportionally-keeping-the-aspect-ratio*/
function calculateAspectRatioFit(srcWidth, srcHeight, maxWidth, maxHeight) {
    var ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
    return {
        width: srcWidth * ratio,
        height: srcHeight * ratio,
    };
}

function setEventListeners(html, app) {
    //look for the images and videos with the clickable image class, and add event listeners for being hovered over (to highlight and dehighlight),
    //and event listeners for the "displayImage" function when clicked
    // execute(html, app);
    wait().then(execute.bind(null, [html, app]));
}

function wait(callback) {
    return new Promise(function (resolve, reject) {
        resolve();
    });
}

export async function determineLocation(event, journalSheet, url) {
    event.stopPropagation();
    // event.stopImmediatePropagation();

    //on click, this method will determine if the image should open in a scene or in a display journal
    let location = game.settings.get("journal-to-canvas-slideshow", "displayLocation");
    switch (location) {
        case "displayScene":
        case "anyScene":
            //if the setting is to display it in a scene, proceed as normal
            await displayImageInScene(event, journalSheet, url);
            break;
        case "window":
            if (url != undefined) {
                //if the url is not undefined, it means that this method is being called from the setUrlImageToShow() method
                displayImageInWindow(url);
            } else {
                //if not, it happened because of an image click, so find the information of the clicked image
                getImageSource(event, displayImageInWindow);
            }
            break;
    }
}

function execute(args) {
    let [html, app] = args;
    //default behavior, for journals
    // html.find(".clickableImage").each((i, img) => {
    //     img.addEventListener("click", (event) => determineLocation(event, app), false);
    // });
    // this one is for actor sheets. Right click to keep it from conflicting with the default behavior of selecting an image for the actor.
    if (checkSettingEquals("useActorSheetImages", true)) {
        html.find(".rightClickableImage").each((i, img) => {
            img.addEventListener("contextmenu", (event) => determineLocation(event, app), false);
        });
    }
}

export async function createBoundingTile() {
    var ourScene = game.scenes.viewed;
    const tex = await loadTexture("/modules/journal-to-canvas-slideshow/artwork/Bounding_Tile.png");
    var dimensionObject = calculateAspectRatioFit(tex.width, tex.height, ourScene.data.width, ourScene.data.height);

    let boundingTile = await ourScene.createEmbeddedDocuments("Tile", [
        {
            img: "/modules/journal-to-canvas-slideshow/artwork/Bounding_Tile.png",
            width: dimensionObject.width,
            height: dimensionObject.height,
            x: 0,
            y: ourScene.data.height / 2 - dimensionObject.height / 2,
        },
    ]);
    convertBoundingTile(boundingTile.data);
}

function ShowWelcomeMessage() {
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

function DisableWelcomeMessage() {
    //disable the welcome message
    game.settings.set("journal-to-canvas-slideshow", "showWelcomeMessage", false);
}

export function setDisplayLocationInSettings(location) {
    game.settings.set("journal-to-canvas-slideshow", "displayLocation", location);
    var locationString;
    if (location == "displayScene") {
        locationString = "Display Scene";
    } else if (location == "anyScene") {
        locationString = "Any Scene";
    } else {
        locationString = "Window";
    }
    ui.notifications.info("Display location set to " + locationString);
}

function applySceneHeaderButtons(app, html, options) {
    //likely being called by Hooks.on(renderJournalSheet)
    var journalEntry = app.entity;
    var element = app.element;
    if (!game.user.isGM) {
        //if the user isn't the GM, return
        return;
    }
    //remove and a create a new button
    if (game.settings.get("journal-to-canvas-slideshow", "hideHeaderToggle") == "show") {
        html.closest(".app").find("a.toggle-display-location").remove();

        let button = $(`<a class="toggle-display-location"><i class="far fa-image"></i>Toggle Display Location</a>`);
        button.click((event) => {
            event.preventDefault();
            toggleDisplayLocation(journalEntry, html, button);
        });
        const titleElement = html.closest(".app").find(".window-title");
        button.insertAfter(titleElement);
    } else if (game.settings.get("journal-to-canvas-slideshow", "hideHeaderToggle") == "iconOnly") {
        html.closest(".app").find("a.toggle-display-location").remove();

        let button = $(`<a class="toggle-display-location"><i class="far fa-image"></i></a>`);
        button.click((event) => {
            event.preventDefault();
            toggleDisplayLocation(journalEntry, html, button);
        });
        const titleElement = html.closest(".app").find(".window-title");
        button.insertAfter(titleElement);
    } else if (game.settings.get("journal-to-canvas-slideshow", "hideHeaderToggle") == "hide") {
        html.closest(".app").find("a.toggle-display-location").remove();
    }
}

export function toggleDisplayLocation(journalEntry, html, button) {
    let locations = ["displayScene", "window", "anyScene"];
    let index = locations.indexOf(game.settings.get("journal-to-canvas-slideshow", "displayLocation"));
    index += 1;
    if (index === 3) {
        index = 0;
    }
    setDisplayLocationInSettings(locations[index]);
}

function createDialog() {
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
function createToggleDialog() {
    let d = new Dialog({
        title: "Switch Display Location",
        content: "Click which display location you'd like to use",
        buttons: {
            displayScene: {
                label: "Display Scene",
                callback: () => {
                    setDisplayLocationInSettings("displayScene");
                },
            },
            anyScene: {
                label: "Any Scene With Bounding Tile",
                callback: () => {
                    setDisplayLocationInSettings("anyScene");
                },
            },
            window: {
                label: "Window",
                callback: () => {
                    setDisplayLocationInSettings("window");
                },
            },
        },
    }).render(true);
}

Hooks.on("getSceneControlButtons", (controls) => {
    //controls refers to all of the controls
    const tileControls = controls.find((control) => control?.name === "tiles");

    if (game.user.isGM) {
        if (game.settings.get("journal-to-canvas-slideshow", "hideTileButtons") == true) {
            //if the user wants to hide the tile buttons in the settings, only push the button to show the slideshow dialog to the scene controls
            tileControls.tools.push({
                name: "ShowJTCSConfig",
                title: "Show Slideshow Config",
                icon: "far fa-image",
                onClick: () => {
                    new SlideshowConfig().render(true);
                },
                button: true,
            });
        } else {
            tileControls.tools.push({
                name: "SwitchDisplayLocation",
                title: "Switch Display Location",
                icon: "fas fa-exchange-alt",
                onClick: () => {
                    createToggleDialog();
                },
                button: true,
            });
            tileControls.tools.push({
                name: "Create-Bounding-Tile",
                title: "Create bounding tile",
                icon: "far fa-square",
                visible: true,
                onClick: () => {
                    createBoundingTile();
                },
                button: true,
            });
            tileControls.tools.push({
                name: "Create-Display-Tile",
                title: "Create Display tile",
                icon: "far fa-image",
                visible: true,
                onClick: () => {
                    createDisplayTile(game.scenes.viewed);
                },
                button: true,
            });
            tileControls.tools.push({
                //tokenButton.tools.push({
                name: "set-url-image",
                title: "Set url image",
                icon: "fa fa-eye",
                visible: true,
                onClick: () => {
                    setUrlImageToShow();
                },
                button: true,
            });
        }
        //push the clear display button regardless of what setting is selected
        tileControls.tools.push({
            name: "ClearDisplay",
            title: "ClearDisplay",
            icon: "fas fa-times-circle",
            onClick: () => {
                determineWhatToClear();
            },
            button: true,
        });
    }
});
Hooks.on("renderSidebarTab", createSceneButton); //for sidebar stuff on left

Hooks.on("renderJournalSheet", (app, html, options) => {
    if (!game.user.isGM) {
        //if the user isn't the GM, return
        return;
    }
    //this method will place buttons at the top of the sheet that you can toggle between
    applySceneHeaderButtons(app, html, options); //add buttons to the header of the journal
    applyClasses(app, html); //add classes to all the images in the sheet

    setEventListeners(html, app); //add all the event listeners to the images in the sheet

    if (findDisplayJournal() && app.object == displayJournal) {
        //find the display journal
        //the image that will be changed
        journalImage = html.find(".lightbox-image");
    }
});

Hooks.on("renderActorSheet", (app, html, options) => {
    //here we need to find the image
    applyClasses(app, html);
});

Hooks.on("renderItemSheet", (app, html, options) => {
    //here we need to find the image
    applyClasses(app, html);
});

function applyClasses(app, html) {
    if (game.user.isGM) {
        //find all img and video tags in the html, and add the clickableImage class to all of them
        if (app.actor != undefined) {
            //if not undefined, it means this is this is an actor sheet
            if (game.settings.get("journal-to-canvas-slideshow", "useActorSheetImages")) {
                const imgs = html.find("img[data-edit]").addClass("rightClickableImage");
                const videos = html.find("video[data-edit]").addClass("rightClickableImage");
            }

            const imgs = html.find("div.editor-content img:not([data-edit])").addClass("clickableImage");
            const videos = html.find("div.editor-content video:not([data-edit])").addClass("clickableImage");
        } else if (app.item != undefined) {
            const imgs = html.find("div.editor-content img:not([data-edit])").addClass("clickableImage");
            const videos = html.find("div.editor-content video:not([data-edit])").addClass("clickableImage");
        } else if (app.object != displayJournal) {
            //if it's a journal
            //unless it's a display journal, as we don't want that clickable
            html.find("img").addClass("clickableImage");
            html.find("video").addClass("clickableImage");

            //find the lightbox images for the 'image' journal mode as well and do the same as above
            html.find(".lightbox-image").each((i, div) => {
                div.classList.add("clickableImage");
            });

            Array.from(html[0].querySelectorAll(".clickableImage")).forEach((img) => injectImageControls(img, app));
        }
    }
}

Hooks.once("init", async function () {
    console.log("Initializing Journal to Canvas Slideshow");
    registerSettings();
    libWrapper.register(
        "journal-to-canvas-slideshow",
        "TextEditor._onDropEditorData",
        function (wrapped, ...args) {
            let event = args[0];
            let editor = args[1];
            var files = event.dataTransfer.files;
            let containsImage = false;
            for (let f of files) {
                let type = f["type"].split("/")[0];
                if (type === "image") {
                    containsImage = true;
                    insertImageIntoJournal(f, editor);
                }
            }
            if (!containsImage) {
                console.log("TextEditor._onDropEditorData called");
                return wrapped(...args);
            }
        },
        "MIXED"
    );
});

async function insertImageIntoJournal(file, editor) {
    if (typeof ForgeVTT != "undefined" && ForgeVTT.usingTheForge) {
        source = "forgevtt";
    } else {
        var source = "data";
    }
    let response;
    if (file.isExternalUrl) {
        response = {
            path: file.url,
        };
    } else {
        response = await FilePicker.upload(
            source,
            "/upload",
            // game.settings.get("journal-to-canvas-slideshow", "imageSaveLocation"),
            file,
            {}
        );
    }
    console.log(response);
    let contentToInsert = `<p><img src="${response.path}" width="512" height="512" /></p>`;
    if (contentToInsert) editor.insertContent(contentToInsert);
}

Hooks.once("ready", () => {
    findDisplayJournal();
    displaySceneFound();

    if (game.settings.get("journal-to-canvas-slideshow", "showWelcomeMessage") == true && game.user.isGM) {
        //if we have it set to show the welcome message, and the user is the GM
        ShowWelcomeMessage();
    }
});

function setUrlImageToShow() {
    new Dialog({
        title: "Set url image",
        content: `
		  <form>
			<div class="form-group">
			  <label>Set url image</label>
			  <input type='text' name='inputField'></input>
			</div>
		  </form>`,
        buttons: {
            yes: {
                icon: "<i class='fas fa-check'></i>",
                label: `Apply Changes`,
            },
        },
        default: "yes",
        close: (html) => {
            let result = html.find("input[name='inputField']");
            if (result.val() !== "") {
                determineLocation(null, result.val());
            }
        },
    }).render(true);
}

async function scaleToScene(displayTile, tex, url) {
    var dimensionObject = calculateAspectRatioFit(
        tex.width,
        tex.height,
        displayScene.data.width,
        displayScene.data.height
    );
    //scale down factor is how big the tile will be in the scene
    //make this scale down factor configurable at some point
    var scaleDownFactor = 200;
    dimensionObject.width -= scaleDownFactor;
    dimensionObject.height -= scaleDownFactor;
    //half of the scene's width or height is the center -- we're subtracting by half of the image's width or height to account for the offset because it's measuring from top/left instead of center

    //separate objects depending on the texture's dimensions --
    //create an 'update' object for if the image is wide (width is bigger than height)
    var wideImageUpdate = {
        _id: displayTile.id,
        width: dimensionObject.width,
        height: dimensionObject.height,
        img: url,
        x: scaleDownFactor / 2,
        y: displayScene.data.height / 2 - dimensionObject.height / 2,
    };
    //create an 'update' object for if the image is tall (height is bigger than width)
    var tallImageUpdate = {
        _id: displayTile.id,
        width: dimensionObject.width,
        height: dimensionObject.height,
        img: url, // tex.baseTexture.resource.url,
        y: scaleDownFactor / 2,
        x: displayScene.data.width / 2 - dimensionObject.width / 2,
    };
    //https://stackoverflow.com/questions/38675447/how-do-i-get-the-center-of-an-image-in-javascript
    //^used the above StackOverflow post to help me figure that out

    //Determine if the image or video is wide, tall, or same dimensions and update depending on that
    let testArray = [tallImageUpdate, wideImageUpdate];

    if (dimensionObject.height > dimensionObject.width) {
        //if the height is longer than the width, use the tall image object
        return tallImageUpdate;
        // return await displayScene.updateEmbeddedDocuments("Tile", [tallImageUpdate]);
    } else if (dimensionObject.width > dimensionObject.height) {
        //if the width is longer than the height, use the wide image object
        return wideImageUpdate;
        // return await displayScene.updateEmbeddedDocuments("Tile", [wideImageUpdate]);
    }

    //if the image length and width are pretty much the same, just default to the wide image update object
    return wideImageUpdate;
    // return await displayScene.updateEmbeddedDocuments("Tile", [wideImageUpdate]);
}

async function scaleToBoundingTile(displayTile, boundingTile, tex, url) {
    var dimensionObject = calculateAspectRatioFit(
        tex.width,
        tex.height,
        boundingTile.data.width,
        boundingTile.data.height
    );

    var imageUpdate = {
        _id: displayTile.id,
        width: dimensionObject.width,
        height: dimensionObject.height,
        img: url,
        y: boundingTile.data.y,
        x: boundingTile.data.x,
    };
    //Ensure image is centered to bounding tile (stops images hugging the top left corner of the bounding box).
    var boundingMiddle = {
        x: boundingTile.data.x + boundingTile.data.width / 2,
        y: boundingTile.data.y + boundingTile.data.height / 2,
    };

    var imageMiddle = {
        x: imageUpdate.x + imageUpdate.width / 2,
        y: imageUpdate.y + imageUpdate.height / 2,
    };

    imageUpdate.x += boundingMiddle.x - imageMiddle.x;
    imageUpdate.y += boundingMiddle.y - imageMiddle.y;
    // var updateArray = [];
    // updateArray.push(imageUpdate);
    return imageUpdate;
}
