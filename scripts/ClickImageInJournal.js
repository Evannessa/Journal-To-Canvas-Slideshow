import ImageVideoPopout from '../classes/MultiMediaPopout.js'
import {
	registerSettings
} from './settings.js'

import {
	SlideshowConfig
} from './SlideshowConfig.js'

var displayScene;
var displayTile;
var displayJournal;
var journalImage;
var popout;

// function registerLayer() {
// 	const layers = mergeObject(Canvas.layers, {
// 		slideshow: SlideshowLayer
// 	});
// 	Object.defineProperty(Canvas, 'layers', {
// 		get: function () {
// 			return layers;
// 		}
// 	});
// }

function highlight(ev) {
	//when hovering over an image, 'highlight' it by changing its shadow
	let element = ev.target;
	element.style.borderStyle = "solid";
	element.style.borderColor = "white";
	element.style.borderSize = "4px";
	element.style.boxShadow = "10px 10px 10px rgba(50, 51, 59, 0.5)";
	element.style.cursor = "pointer";
}

function dehighlight(ev) {
	//when no longer hovering over an image, remove the 'highlight'
	let element = ev.target;
	element.style.cursor = "default";
	element.style.boxShadow = "none";
	element.style.borderStyle = "none";
}

function depressImage(ev) {
	//as click
	let element = ev.target;
	element.style.boxShadow = "2px 2px 2px rgba(50, 51, 59, 0.5)";
}

function liftImage(ev) {
	//after click
	let element = ev.target;
	element.style.boxShadow = "10px 10px 10px rgba(50, 51, 59, 0.5)";


}


function FindDisplayJournal() {
	let journalEntries = game.journal.entries;
	let foundDisplayJournal = false;
	journalEntries.forEach(element => {
		//go through elements. If found, set bool to true. If not, it'll remain false. Return.
		if (element.name == "Display Journal") {
			displayJournal = element;
			foundDisplayJournal = true;
		}
	});
	return foundDisplayJournal;

}

async function CreateDisplayJournal() {
	//create a display journal
	if (!FindDisplayJournal()) {
		displayJournal = await JournalEntry.create({
			name: "Display Journal"
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
//borrowed this code from Foundry Discord
async function sleep(millis) {
	return new Promise(r => setTimeout(r, millis));
}

async function ChangePopoutImage(url) {
	//...
	// get the url from the image clicked in the journal
	//if popout doesn't exist
	if (game.settings.get("journal-to-canvas-slideshow", "displayWindowBehavior") == "newWindow") {
		//if we would like to display in a new popout window
		popout = new ImageVideoPopout(url, {
			shareable: true
		}).render(true).shareImage();


	} else if (game.settings.get("journal-to-canvas-slideshow", "displayWindowBehavior") == "journalEntry") {
		//if we would like to display in a dedicated journal entry
		if (!FindDisplayJournal()) {
			//couldn't find display journal, so return
			ui.notifications.error("No journal entry named " + game.settings.get("journal-to-canvas-slideshow", "displayName") + " found");
			return;
		} else {

			if (game.settings.get("journal-to-canvas-slideshow", "autoShowDisplay")) {
				//if we have the auto show display settings on, automatically show the journal after the button is clicked
				displayJournal.render(false, {});
				//	displayJournal.show("image", true);
			}
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
			`

			update = {
				_id: displayJournal._id,
				content: videoHTML,
				img: ""
			}

			const updated = await displayJournal.update(update, {})
			displayJournal.show("text", true)
		} else {
			//change the background image to be the clicked image in the journal
			update = {
				_id: displayJournal._id,
				content: "",
				img: url
			}
			const updated = await displayJournal.update(update, {})
			displayJournal.show("image", true)
		}
	}

}

function getImageSource(ev, myCallback) {

	let element = ev.currentTarget;
	let type = element.nodeName;
	let url;


	if (type == "IMG") {
		//if it's an image element
		url = element.getAttribute("src");
	} else if (type == "VIDEO") {
		//if it's a video element
		url = element.getElementsByTagName("source")[0].getAttribute("src");
	} else if (type == "DIV" && element.classList.contains("lightbox-image")) {
		//if it's a lightbox image on an image-mode journal
		//https://stackoverflow.com/questions/14013131/how-to-get-background-image-url-of-an-element-using-javascript -- 
		//used elements from the above StackOverflow to help me understand how to retrieve the background image url
		let img = element.style;
		url = img.backgroundImage.slice(4, -1).replace(/['"]/g, "");
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

async function createDisplayTile(ourScene) {
	const tex = await loadTexture("/modules/journal-to-canvas-slideshow/artwork/DarkBackground.png");
	var dimensionObject = calculateAspectRatioFit(tex.width, tex.height, ourScene.data.width, ourScene.data.height);
	var newTile;
	newTile = await Tile.create({
		img: "/modules/journal-to-canvas-slideshow/artwork/DarkBackground.png",
		width: dimensionObject.width,
		height: dimensionObject.height,
		x: 0,
		y: (ourScene.data.height / 2) - (dimensionObject.height / 2)
	});

	newTile.setFlag("journal-to-canvas-slideshow", "name", "displayTile");

}



async function displayImageInScene(ev, externalURL) {

	var ourScene;
	var boundingTile = game.scenes.viewed.getEmbeddedCollection("Tile").find(({
		img
	}) => img.toLowerCase().includes("bounding_tile"));
	if (game.settings.get("journal-to-canvas-slideshow", "displayLocation") == "displayScene") {
		if (DisplaySceneFound()) {
			//set the scene we're using to be the display scene
			ourScene = displayScene;
			//if we're using the display scene, search for a bounding tile in the display scene rather than the viewed scene
			boundingTile = displayScene.getEmbeddedCollection("Tile").find(({
		img
	}) => img.toLowerCase().includes("bounding_tile"));
		} else {
			//if there is no display scene, return
			ui.notifications.error("No display scene found. Please make sure you have a scene named " + game.settings.get("journal-to-canvas-slideshow", "displayName"))
			return;
		}
	} else {
		//if the display location setting is set to "Any Scene"
		if (boundingTile) {
			//if the scene isn't the display scene but has a bounding Tile
			//the scene we're using is the currently viewed scene
			ourScene = game.scenes.viewed;
		} else {
			//
			if (DisplaySceneFound() && displayScene == game.scenes.viewed) {
				ui.notifications.warn("'Any Scene' setting selected and Display Scene viewed, but no bounding tile present; reverting to showing image as default")
				ourScene = displayScene;
			} else {
				ui.notifications.error("Not viewing display scene, but no bounding tile present")
				return;
			}
		}
	}
	if (game.settings.get("journal-to-canvas-slideshow", "autoShowDisplay")) {
		//if the settings have it set to automatically show the display, activate the scene
		await ourScene.activate()
	}
	//get the element whose source we want to display as a tile, and what type it is (image or video)
	let url;

	if (externalURL) {
		url = externalURL;
	}
	//check if element is an image or a video, and get the 'source' depending on which. Return if neither, but this shouldn't be the case.
	else {
		url = getImageSource(ev)
		if (url == null) {
			ui.notifications.error("Type not supported")
		}
	}

	//keep track of the tile, which should be the first tile in the display scene
	//TODO: Find tile with flag name of DisplayTile
	var displayTile = FindDisplayTile(ourScene); //displayScene.getEmbeddedCollection("Tile")[0];

	if (!displayTile) {
		ui.notifications.error("No display tile found -- make sure your scene has a display tile");
		return;
	}


	//load the texture from the source
	const tex = await loadTexture(url);
	var imageUpdate;

	if (!boundingTile) {
		imageUpdate = await scaleToScene(displayTile, tex, url);
	} else {
		imageUpdate = await scaleToBoundingTile(displayTile, boundingTile, tex, url)
	}

	const updated = await ourScene.updateEmbeddedEntity("Tile", imageUpdate);




}

function FindDisplayTile(ourScene) {
	//find the display tile in the scene
	var ourTile;
	var tiles = ourScene.getEmbeddedCollection("Tile")
	console.log(tiles)
	console.log(canvas.tiles.placeables)
	for (let tile of tiles) {
		console.log(tile)
		if (tile.flags["journal-to-canvas-slideshow"] ?.name == "displayTile") {
			ourTile = tile;
		}
	}
	// canvas.tiles.placeables.forEach((tile) => {
	// 	if (tile.getFlag("journal-to-canvas-slideshow", "name")) {
	// 		ourTile = tile;
	// 	}
	// })

	return ourTile //.data
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
		button.click(GenerateDisplayScene);
		html.find(".directory-footer").prepend(button);
	}
	if (app.options.id == "journal") {
		//create the journal button for generating a popout
		let button = $("<button>Create or Show Display Entry</button>");
		button.click(CreateDisplayJournal);
		html.find(".directory-footer").prepend(button);
	}


}


async function GenerateDisplayScene() {
	//create a Display" scene 
	//set the scene to 2000 by 2000, and set the background color to a dark gray
	if (!DisplaySceneFound()) {
		displayScene = null;
		displayTile = null;

		//create a new scene named display
		displayScene = await Scene.create({
			name: game.settings.get("journal-to-canvas-slideshow", "displayName")
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
			gridType: 0
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
	if (!FindDisplayJournal()) {
		return;
	}
	let url = "/modules/journal-to-canvas-slideshow/artwork/HD_transparent_picture.png";
	let update = {
		_id: displayJournal._id,
		img: url,
		content: `<div></div>`
	}

	const updated = await displayJournal.update(update, {});

}

async function clearDisplayTile() {
	//clear a tile for the scene
	var displayTile = FindDisplayTile(game.scenes.viewed)
	if (!DisplaySceneFound() && displayTile == undefined) {
		//if we're not on the display scene and there's no display tile 
		return;
	}
	var ourScene
	if (game.settings.get("journal-to-canvas-slideshow", "displayLocation") == "displayScene") {
		ourScene = displayScene;
	} else {
		ourScene = game.scenes.viewed
	}


	if (!displayTile) {
		ui.notifications.error("No display tile found -- make sure the display scene has a tile");
	}
	const tex = await loadTexture("/modules/journal-to-canvas-slideshow/artwork/HD_transparent_picture.png");
	// var dimensionObject = calculateAspectRatioFit(tex.width, tex.height, ourScene.data.width, ourScene.data.height);

	var clearTileUpdate = {
		_id: displayTile._id,
		img: "/modules/journal-to-canvas-slideshow/artwork/HD_transparent_picture.png",
		// width: dimensionObject.width,
		// height: dimensionObject.height,
		// x: 0,
		// y: (displayScene.data.height / 2) - (dimensionObject.height / 2)
	};
	const updated = await ourScene.updateEmbeddedEntity("Tile", clearTileUpdate);
}

function DisplaySceneFound() {
	// getting the scenes, we want to make sure the tile only happens on the particular display scene
	// so we want it to update on the specific scene and no others
	var scenes = game.scenes.entries;
	var displaySceneFound = false;
	for (var scn of scenes) {
		if (scn.name == game.settings.get("journal-to-canvas-slideshow", "displayName")) {
			//if we found the scene, make the display scene variable equal this scene
			displayScene = scn;
			displaySceneFound = true;
		}
	}
	//return whether or not we've found a scene named 'Display'
	return displaySceneFound;

}

// V Used snippet from the below stackOverflow answer to help me with proportionally resizing the images
/*https://stackoverflow.com/questions/3971841/how-to-resize-images-proportionally-keeping-the-aspect-ratio*/
function calculateAspectRatioFit(srcWidth, srcHeight, maxWidth, maxHeight) {
	var ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
	return {
		width: srcWidth * ratio,
		height: srcHeight * ratio
	};

}

function setEventListeners(html) {
	//look for the images and videos with the clickable image class, and add event listeners for being hovered over (to highlight and dehighlight),
	//and event listeners for the "displayImage" function when clicked
	wait().then(execute.bind(null, html));
}

function wait(callback) {
	return new Promise(function (resolve, reject) {
		resolve();
	})
}

function determineLocation(ev, url) {
	//on click, this method will determine if the image should open in a scene or in a display journal
	let location = game.settings.get("journal-to-canvas-slideshow", "displayLocation");
	if (location == "displayScene" || location == "anyScene") {
		//if the setting is to display it in a scene, proceed as normal
		displayImageInScene(ev, url);
	} else if (location == "window") {
		//if the setting is to display it in a popout, change it to display in a popout
		if (url != undefined) {
			//if the url is not undefined, it means that this method is being called from the setUrlImageToShow() method
			ChangePopoutImage(url);
		} else {
			//if not, it happened because of an image click, so find the information of the clicked image
			getImageSource(ev, ChangePopoutImage);
		}
	}


}

function execute(html) {
	//default behavior, for journals
	html.find('.clickableImage').each((i, div) => {
		div.addEventListener("click", determineLocation, false);
		div.addEventListener("mouseover", highlight, false);
		div.addEventListener("mouseout", dehighlight, false);
		div.addEventListener("mousedown", depressImage, false);
		div.addEventListener("mouseup", liftImage, false);
	});
	//this one is for actor sheets. Right click to keep it from conflicting with the default behavior of selecting an image for the actor.
	html.find('.rightClickableImage').each((i, div) => {
		div.addEventListener("contextmenu", determineLocation, false)  ;
		div.addEventListener("mouseover", highlight, false);
		div.addEventListener("mouseout", dehighlight, false);
		div.addEventListener("mousedown", depressImage, false);
		div.addEventListener("mouseup", liftImage, false);
	});
}

async function createBoundingTile() {
	var ourScene = game.scenes.viewed;
	const tex = await loadTexture("/modules/journal-to-canvas-slideshow/artwork/Bounding_Tile.png");
	var dimensionObject = calculateAspectRatioFit(tex.width, tex.height, ourScene.data.width, ourScene.data.height);

	displayTile = await Tile.create({
		img: "/modules/journal-to-canvas-slideshow/artwork/Bounding_Tile.png",
		width: dimensionObject.width,
		height: dimensionObject.height,
		x: 0,
		y: (ourScene.data.height / 2) - (dimensionObject.height / 2)
	});
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
				callback: DisableWelcomeMessage
			},
			continue: {
				label: "Continue without Disabling"
			}
		}
	});
	d.render(true);
}

function DisableWelcomeMessage() {
	//disable the welcome message
	game.settings.set("journal-to-canvas-slideshow", "showWelcomeMessage", false)
}

function setDisplayLocationInSettings(location) {
	game.settings.set("journal-to-canvas-slideshow", "displayLocation", location)
	var locationString;
	if (location == "displayScene") {
		locationString = "Display Scene"
	} else if (location == "anyScene") {
		locationString = "Any Scene"
	} else {
		locationString = "Window";
	}
	ui.notifications.info("Display location set to " + locationString)
}

function applySceneHeaderButtons(app, html, options) {
	//likely being called by Hooks.on(renderJournalSheet)
	var journalEntry = app.entity;
	console.log("applying buttons")
	console.log(app.element)
	var element = app.element;
	//console.log(html)
	// console.log(options)
	if (!game.user.isGM) {
		//if the user isn't the GM, return
		return;
	}
	//create a button 
	let button = $(`<a class="header-button toggle-display-location"><i class="far fa-image"></i>Toggle Display Location</a>`);
	console.log("How many buttons")
	console.log(element[0])
	// console.log(element.find("a.toggle-display-location"))
	// console.log($('a.toggle-display-location'))
	if (element.find("a.toggle-display-location").length == 0) {
		//if you can't find a toggle display location button in the header, only then place it, as we don't want duplicates
		button.click((event) => {
			event.preventDefault();
			toggleDisplayLocation(journalEntry, html, button)
		});
		let firstButton = element.find("a.header-button")[0];
		firstButton.parentNode.insertBefore(button[0], firstButton)
	}
}

function toggleDisplayLocation(journalEntry, html, button) {
	let locations = [
		"displayScene",
		"window",
		"anyScene"
	]
	let index = locations.indexOf(game.settings.get("journal-to-canvas-slideshow", "displayLocation"))
	index += 1;
	if (index === 3) {
		index = 0;
	}
	setDisplayLocationInSettings(locations[index]);

}

function createDialog(){

	const options = {
		width: 600,
		height: 250,
	} 
	let myContent = function (val) {
		return `<p>Create display and bounding tiles, set url image, and/or select which display location you'd like to use</p>
		 <form>
			<div class="form-group">
			  <label>Set url image</label>
			  <input type='text' name='inputField' value=${val}></input>
			</div>
		  </form>`
		
	}
	
	let d = new Dialog({
		title: "Slideshow Config",
		content: myContent(''),
		buttons: {
			applyURLImage: {
				label: "Set URL Image",
				icon: "<i class='fa fa-eye'></i>",
				callback: (html) => {
					let result = html.find('input[name=\'inputField\']');
					if (result.val() !== '') {
						determineLocation(null, result.val());
						d.data.content = myContent(result.val())
						d.render(true)
				}
			}},
			displayScene: {
				label: "Use Display Scene",
				icon: '<i class="fas fa-exchange-alt"></i>',
				callback: (html) => {
					setDisplayLocationInSettings("displayScene")
					let result = html.find('input[name=\'inputField\']');
					d.data.content = myContent(result.val())
					d.render(true)
				}
			},
			anyScene: {
				label: "Use Any Scene With Bounding Tile",
				icon: '<i class="fas fa-exchange-alt"></i>',
				callback: (html) => {
					setDisplayLocationInSettings("anyScene")
					let result = html.find('input[name=\'inputField\']');
					d.data.content = myContent(result.val())
					d.render(true)
				}
			},
			window: {
				label: "Use Window",
				icon: '<i class="fas fa-exchange-alt"></i>',
				callback: (html) => {
					setDisplayLocationInSettings("window")
					let result = html.find('input[name=\'inputField\']');
					d.data.content = myContent(result.val())
					d.render(true)
				}
			},	
			createDisplayTile: {
				label: "Create Display Tile",
				icon: "<i class='far fa-image'></i>",
				callback: (html) => {
					createDisplayTile(game.scenes.viewed)
					let result = html.find('input[name=\'inputField\']');
					d.data.content = myContent(result.val())
					d.render(true)
				}
			},
			createBoundingTile: {
				label: "Create Bounding Tile",
				icon: "<i class='far fa-square'></i>",
				callback: (html) => {
					createBoundingTile();
					let result = html.find('input[name=\'inputField\']');
					d.data.content = myContent(result.val())
					d.render(true)
				}
			}
		}
	}, options).render(true);

}
function createToggleDialog() {
	let d = new Dialog({
		title: "Switch Display Location",
		content: "Click which display location you'd like to use",
		buttons: {
			displayScene: {
				label: "Display Scene",
				callback: () => {
					setDisplayLocationInSettings("displayScene")
				}
			},
			anyScene: {
				label: "Any Scene With Bounding Tile",
				callback: () => {
					setDisplayLocationInSettings("anyScene")
				}
			},
			window: {
				label: "Window",
				callback: () => {
					setDisplayLocationInSettings("window")
				}
			}


		}

	}).render(true);
}

//#region 
// function createSlideshowDialog() {
// 	let d = new Dialog({
// 		title: "Create Slideshow Tiles",
// 		content: "Click whether you'd like to create a display or bounding tile",
// 		buttons: {
// 			createDisplayTile: {
// 				label: "Create Display Tile",
// 				callback: () => {
// 					createDisplayTile(game.scenes.viewed)
// 				}
// 			},
// 			createBoundingTile: {
// 				label: "Create Bounding Tile",
// 				callback: () => {
// 					createBoundingTile();
// 				}
// 			}

// 		}
// 	}).render(true);


// }
//#endregion
Hooks.on("getSceneControlButtons", (controls) => {
	//controls refers to all of the controls
	const tileControls = controls.find((control) => control ?.name === "tiles");

	if (game.user.isGM) {

		if (game.settings.get("journal-to-canvas-slideshow", "hideTileButtons") == true) {
			//if the user wants to hide the tile buttons in the settings, only push the button to show the slideshow dialog to the scene controls
			tileControls.tools.push({
				name: 'ShowJTCSConfig',
				title: 'Show Slideshow Config',
				icon: 'far fa-image',
				onClick: () => {
					createDialog();
				},
				button: true
			})
		} else {
			tileControls.tools.push({
				name: 'SwitchDisplayLocation',
				title: 'Switch Display Location',
				icon: 'fas fa-exchange-alt',
				onClick: () => {
					createToggleDialog();
				},
				button: true
			})
			tileControls.tools.push({
				name: 'Create-Bounding-Tile',
				title: "Create bounding tile",
				icon: "far fa-square",
				visible: true,
				onClick: () => {
					createBoundingTile();
				},
				button: true
			})
			tileControls.tools.push({
				name: 'Create-Display-Tile',
				title: "Create Display tile",
				icon: "far fa-image",
				visible: true,
				onClick: () => {
					createDisplayTile(game.scenes.viewed);
				},
				button: true
			})
			tileControls.tools.push({
				//tokenButton.tools.push({
				name: "set-url-image",
				title: 'Set url image',
				icon: "fa fa-eye",
				visible: true,
				onClick: () => {
					setUrlImageToShow();
				},
				button: true
			});

		}
		//push the clear display button regardless of what setting is selected
			tileControls.tools.push({
				name: 'ClearDisplay',
				title: 'ClearDisplay',
				icon: 'fas fa-times-circle',
				onClick: () => {
					determineWhatToClear(); //clearDisplayTile();	
				},
				button: true
			})
		

			
		}

	
});
Hooks.on("renderSidebarTab", createSceneButton); //for sidebar stuff on left


Hooks.on("renderJournalSheet", (app, html, options) => {
	// if (game.user.isGM) {
	// 	//find all img and video tags in the html, and add the clickableImage class to all of them
	// 	if (app.object != displayJournal) {
	// 		//unless it's a display journal, as we don't want it clickable
	// 		html.find('img').attr("class", "clickableImage");
	// 		html.find('video').attr("class", "clickableImage");
	// 		//find the lightbox images for the 'image' journal mode as well and do the same as above
	// 		html.find(".lightbox-image").each((i, div) => {
	// 			div.classList.add("clickableImage");
	// 		})
	// 	}
	//this method will place buttons at the top of the sheet that you can toggle between
	applySceneHeaderButtons(app, html, options)
	applyClasses(app, html);

	setEventListeners(html);
	if (FindDisplayJournal() && app.object == displayJournal) {
		//find the display journal
		//the image that will be changed 
		journalImage = html.find(".lightbox-image");
	}
	let journalEntry = app.entity;
	journalEntry.setFlag("world", "displayLocation", game.settings.get("journal-to-canvas-slideshow", "displayLocation"))

});
Hooks.on("renderActorSheet", (app, html, options) => {
	//here we need to find the image
	applyClasses(app, html);


});

function applyClasses(app, html) {
	if (game.user.isGM) {
		//find all img and video tags in the html, and add the clickableImage class to all of them
		if(app.actor != undefined){
			//if not undefined, it means this is this is an actor sheet
			html.find('img').addClass("rightClickableImage")
			html.find("video").addClass("rightClickableImage")
		}
		else if (app.object != displayJournal) {
			//if it's a journal
			//unless it's a display journal, as we don't want that clickable
			html.find('img').addClass("clickableImage");
			html.find('video').addClass("clickableImage");
			//find the lightbox images for the 'image' journal mode as well and do the same as above
			html.find(".lightbox-image").each((i, div) => {
				div.classList.add("clickableImage");
			})
		}

		setEventListeners(html);
	}
}

Hooks.once('init', async function () {
	console.log("Initializing Journal to Canvas Slideshow");
	registerSettings();
});
Hooks.once('ready', () => {
	FindDisplayJournal();
	DisplaySceneFound();

	if (game.settings.get("journal-to-canvas-slideshow", "showWelcomeMessage") == true && game.user.isGM) {
		//if we have it set to show the welcome message, and the user is the GM
		ShowWelcomeMessage();
	}
});

function setUrlImageToShow() {
	new Dialog({
		title: 'Set url image',
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
				label: `Apply Changes`
			}
		},
		default: 'yes',
		close: html => {
			let result = html.find('input[name=\'inputField\']');
			if (result.val() !== '') {
				//   let chatData = {
				// 	  user: game.user._id,
				// 	  speaker: ChatMessage.getSpeaker(),
				// 	  content: result.val()
				//   };
				//   ChatMessage.create(chatData, {});
				determineLocation(null, result.val());
			}
		}
	}).render(true);
}

async function scaleToScene(displayTile, tex, url) {
	var dimensionObject = calculateAspectRatioFit(tex.width, tex.height, displayScene.data.width, displayScene.data.height);
	console.log("SCALING TO DISPLAY SCENE")
	console.log(displayScene)
	//scale down factor is how big the tile will be in the scene
	//make this scale down factor configurable at some point
	var scaleDownFactor = 200; //game.settings.get("journal-to-canvas-slideshow", "scaleDown");// 200;
	dimensionObject.width -= scaleDownFactor;
	dimensionObject.height -= scaleDownFactor;
	//half of the scene's width or height is the center -- we're subtracting by half of the image's width or height to account for the offset because it's measuring from top/left instead of center

	//separate objects depending on the texture's dimensions --
	//create an 'update' object for if the image is wide (width is bigger than height)
	var wideImageUpdate = {
		_id: displayTile._id,
		width: dimensionObject.width,
		height: dimensionObject.height,
		img: url,
		x: scaleDownFactor / 2,
		y: ((displayScene.data.height / 2) - (dimensionObject.height / 2))
	};
	//create an 'update' object for if the image is tall (height is bigger than width)
	var tallImageUpdate = {
		_id: displayTile._id,
		width: dimensionObject.width,
		height: dimensionObject.height,
		img: url, // tex.baseTexture.resource.url,
		y: scaleDownFactor / 2,
		x: ((displayScene.data.width / 2) - (dimensionObject.width / 2))
	};
	//https://stackoverflow.com/questions/38675447/how-do-i-get-the-center-of-an-image-in-javascript
	//^used the above StackOverflow post to help me figure that out

	//Determine if the image or video is wide, tall, or same dimensions and update depending on that
	if (dimensionObject.height > dimensionObject.width) {
		//if the height is longer than the width, use the tall image object
		return await displayScene.updateEmbeddedEntity("Tile", tallImageUpdate);

	} else if (dimensionObject.width > dimensionObject.height) {
		//if the width is longer than the height, use the wide image object
		return await displayScene.updateEmbeddedEntity("Tile", wideImageUpdate);
	}

	//if the image length and width are pretty much the same, just default to the wide image update object
	return await displayScene.updateEmbeddedEntity("Tile", wideImageUpdate);
}

async function scaleToBoundingTile(displayTile, boundingTile, tex, url) {
	var dimensionObject = calculateAspectRatioFit(tex.width, tex.height, boundingTile.width, boundingTile.height);

	var imageUpdate = {
		_id: displayTile._id,
		width: dimensionObject.width,
		height: dimensionObject.height,
		img: url,
		y: boundingTile.y,
		x: boundingTile.x
	};
	//Ensure image is centered to bounding tile (stops images hugging the top left corner of the bounding box).
	var boundingMiddle = {
		x: (boundingTile.x + boundingTile.width / 2),
		y: (boundingTile.y + boundingTile.height / 2)
	};

	var imageMiddle = {
		x: (imageUpdate.x + imageUpdate.width / 2),
		y: (imageUpdate.y + imageUpdate.height / 2)
	};

	imageUpdate.x += (boundingMiddle.x - imageMiddle.x);
	imageUpdate.y += (boundingMiddle.y - imageMiddle.y);

	return imageUpdate;
}