//var DisplayTileConfig = require('./DisplayTileConfig.js');
import  DisplayTileConfig  from '../classes/DisplayTileConfig.js'
import  { registerSettings } from './settings.js'

var displayScene;
var displayTile;
var displayJournal;
var journalImage;

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

function depressImage(ev){
	//as click
	let element = ev.target;
	element.style.boxShadow = "2px 2px 2px rgba(50, 51, 59, 0.5)";
}

function liftImage(ev){
	//after click
	let element = ev.target;
	element.style.boxShadow = "10px 10px 10px rgba(50, 51, 59, 0.5)";
	

}


function FindDisplayJournal(){
    let journalEntries = game.journal.entries;
    let foundDisplayJournal = false;
    journalEntries.forEach( element => {
        //go through elements. If found, set bool to true. If not, it'll remain false. Return.
        if(element.name == "Display Journal"){
			displayJournal = element;
            foundDisplayJournal = true;
        }
    });
    return foundDisplayJournal;

}

async function CreateDisplayJournal(){
	//create a display journal
	if(!FindDisplayJournal()){
		displayJournal = await JournalEntry.create({name: "Display Journal"});
	}
	else{
		//if it already exists, render it and show to players
		displayJournal.render(false);
		displayJournal.show("image", true);
	}

}

async function ChangeDisplayImage(url){
    //get the url from the image clicked in the journal
    if(!FindDisplayJournal()){
        //couldn't find display journal, so return
        ui.notifications.error("No journal entry named 'Display Journal' found");
        return;
	}
	else{
		if(game.settings.get("journal-to-canvas-slideshow", "autoShowDisplay")){
			//if we have the auto show display settings on, automatically show the journal after the button is clicked
			displayJournal.render(false, {});
			displayJournal.show("image", true);
		}
	}
	//change the background image to be the clicked image in the journal
	//TODO: find some way to add notifcation to see what mode the journal is in (TEXT OR IMAGE)
	let update = {
		_id: displayJournal._id,
		img: url
	}

	const updated = await displayJournal.update(update, {});

}
async function displayImageInPopout(ev){

	let element = ev.currentTarget;
	let type = element.nodeName;
	let url;


	if (type == "IMG") {
		url = element.getAttribute("src");
	} else if (type == "VIDEO") {
		url = element.getElementsByTagName("source")[0].getAttribute("src");
	} else if (type == "DIV" && element.classList.contains("lightbox-image")) {
		//https://stackoverflow.com/questions/14013131/how-to-get-background-image-url-of-an-element-using-javascript -- 
		//used elements from the above StackOverflow to help me understand how to retrieve the background image url
		let img = element.style;
		url = img.backgroundImage.slice(4, -1).replace(/['"]/g, "");
	} else {
		console.log("Type not supported");
		return;

	}

	//add setting to activate 'show to players' or not
	ChangeDisplayImage(url);
	//load the texture from the source
//	const tex = await loadTexture(url);
}

async function displayImage(ev) {

	//check for the display scene. If found, the displayScene variable will be set to it, and the display scene will be activated
		// 0 should equal the default, a scene
	if (DisplaySceneFound()) {
		//TODO: Make this configurable
		console.log("Auto show display? " + game.settings.get("journal-to-canvas-slideshow", "autoShowDisplay"));
		if(game.settings.get("journal-to-canvas-slideshow", "autoShowDisplay")){
			//this should evaluate to true or false
			console.log("Should automatically show display?");
			displayScene.activate();
		}
	} else {
		//if there is no display scene, return
		console.log("No display scene");
		return;
	}

	//get the element whose source we want to display as a tile, and what type it is (image or video)
	let element = ev.currentTarget;
	let type = element.nodeName;
	let url;

	//check if element is an image or a video, and get the 'source' depending on which. Return if neither, but this shouldn't be the case.
	if (type == "IMG") {
		url = element.getAttribute("src");
	} else if (type == "VIDEO") {
		url = element.getElementsByTagName("source")[0].getAttribute("src");
	} else if (type == "DIV" && element.classList.contains("lightbox-image")) {
		//https://stackoverflow.com/questions/14013131/how-to-get-background-image-url-of-an-element-using-javascript -- 
		//used elements from the above StackOverflow to help me understand how to retrieve the background image url
		let img = element.style;
		url = img.backgroundImage.slice(4, -1).replace(/['"]/g, "");
	} else {
		console.log("Type not supported");
		return;

	}


	//load the texture from the source
	const tex = await loadTexture(url);

	//scales down the dimensions to meet the scene's canvas's size, but keeps the image or video's aspect ratio -- keep track of these dimensions in an object
	var dimensionObject = calculateAspectRatioFit(tex.width, tex.height, displayScene.data.width, displayScene.data.height);


	//keep track of the tile, which should be the first tile in the display scene
	var displayTile = displayScene.getEmbeddedCollection("Tile")[0];
	console.log(displayTile);
	if (!displayTile) {
		ui.notifcations.error("No display tile found -- make sure the display scene has a tile");
	}

	//scane down factor is how big the tile will be in the scene
	//make this scale down factor configurable at some point
	var scaleDownFactor = 200;//game.settings.get("journal-to-canvas-slideshow", "scaleDown");// 200;
	console.log(scaleDownFactor);
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
		img: url,
		y: scaleDownFactor / 2,
		x: ((displayScene.data.width / 2) - (dimensionObject.width / 2))
	};
	//https://stackoverflow.com/questions/38675447/how-do-i-get-the-center-of-an-image-in-javascript
	//^used the above StackOverflow post to help me figure that out

	//Determine if the image or video is wide, tall, or same dimensions and update depending on that
	if (dimensionObject.height > dimensionObject.width) {
		//if the height is longer than the width, use the tall image object
		const updated = await displayScene.updateEmbeddedEntity("Tile", tallImageUpdate);

	} else if (dimensionObject.width > dimensionObject.height) {
		//if the width is longer than the height, use the wide image object
		const updated = await displayScene.updateEmbeddedEntity("Tile", wideImageUpdate);
	} else {
		//if the image length and width are pretty much the same, just default to the wide image update object
		const updated = await displayScene.updateEmbeddedEntity("Tile", wideImageUpdate);
	}


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
	console.log(app.options.id);
	if(app.options.id == "journal"){
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
			name: "Display",
		});
		//activate the scene 
		await displayScene.activate();
		//update the scene
		await displayScene.update({
			name: "Display",
			width: 2000,
			height: 2000,
			backgroundColor: "#202020",
			padding: 0,
			gridType: 0
		});

		//create a tile for the scene
		const tex = await loadTexture("/modules/journal-to-canvas-slideshow/artwork/DarkBackground.png");
		var dimensionObject = calculateAspectRatioFit(tex.width, tex.height, displayScene.data.width, displayScene.data.height);

		displayTile = await Tile.create({
			img: "/modules/journal-to-canvas-slideshow/artwork/DarkBackground.png",
			width: dimensionObject.width,
			height: dimensionObject.height,
			x: 0,
			y: (displayScene.data.height / 2) - (dimensionObject.height / 2)
		});
		//this should refresh the canvas
		canvas.draw();

	} else {
		//if the display scene exits already, just activate it
		displayScene.activate();

	}

}

async function determineWhatToClear(){
	console.log("Determining what to clear!");
	let location = game.settings.get("journal-to-canvas-slideshow", "displayLocation");
	if(location == "scene"){
		clearDisplayTile();
	}
	else if(location == "window"){
		clearDisplayWindow();
	}
}

async function clearDisplayWindow(){
	if(!FindDisplayJournal()){
		return;
	}
	let url = "/modules/journal-to-canvas-slideshow/artwork/HD_transparent_picture.png";   
	let update = {
		_id: displayJournal._id,
		img: url
	}

	const updated = await displayJournal.update(update, {});

}
async function clearDisplayTile() {
	//create a tile for the scene
	if (!DisplaySceneFound()) {
		return;
	}

	var displayTile = displayScene.getEmbeddedCollection("Tile")[0];
	if (!displayTile) {
		ui.notifcations.error("No display tile found -- make sure the display scene has a tile");
	}
	const tex = await loadTexture("/modules/journal-to-canvas-slideshow/artwork/HD_transparent_picture.png");
	var dimensionObject = calculateAspectRatioFit(tex.width, tex.height, displayScene.data.width, displayScene.data.height);

	var clearTileUpdate = {
			_id: displayTile._id,
			img: "/modules/journal-to-canvas-slideshow/artwork/HD_transparent_picture.png",
			width: dimensionObject.width,
			height: dimensionObject.height,
			x: 0,
			y: (displayScene.data.height / 2) - (dimensionObject.height / 2)
	};
	const updated = await displayScene.updateEmbeddedEntity("Tile", clearTileUpdate);
}

function DisplaySceneFound() {
	// getting the scenes, we want to make sure the tile only happens on the particular display scene
	// so we want it to update on the specific scene and no others
	var scenes = game.scenes.entries;
	var displaySceneFound = false;
	for (var scn of scenes) {
		if (scn.name == "Display") {
			//if we found the scene, make the display scene variable equal this scene
			displayScene = scn;
			displaySceneFound = true;
		}
	}
	if (!displaySceneFound) {
		//notify the user that there's no display scene
		ui.notifications.error("No display scene found -- make sure there's a scene named 'Display'");
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

function determineLocation(ev){
	//on click, this method will determine if the image should open in a scene or in a display journal
	let location = game.settings.get("journal-to-canvas-slideshow", "displayLocation");
	if(location == "scene"){
		//if the setting is to display it in a scene, proceed as normal
		console.log("Displaying image in scene");
		displayImage(ev);
	}
	else if(location=="window"){
		//if the setting is to display it in a popout, change it to display in a popout
		console.log("Displaying image in window");
		displayImageInPopout(ev);
	}


}
function execute(html) {
	html.find('.clickableImage').each((i, div) => {
	 	div.addEventListener("click", determineLocation, false);
		div.addEventListener("mouseover", highlight, false);
		div.addEventListener("mouseout", dehighlight, false);
		div.addEventListener("mousedown", depressImage, false);
		div.addEventListener("mouseup", liftImage, false);
	});
}

Hooks.on("getSceneControlButtons", (controls) => {
	//controls refers to all of the controls
	const tileControls = controls.find((control) => control?.name === "tiles");
	if (game.user.isGM) {
		tileControls.tools.push({
				name: 'ClearDisplay',
				title: 'ClearDisplay',
				icon: 'far fa-times-circle',
				onClick: () => {
					determineWhatToClear();//clearDisplayTile();	
				},
				button: true
			})
		}
		// tileControls.tools.push({
		// 	name: 'Display Config',
		// 	title: 'Display Config',
		// 	icon: 'fas fa-cog',
		// 	onClick: () => {
		// 		new DisplayTileConfig().render(true);
		// 	},
		// 	button: true
		// })
});
Hooks.on("renderSidebarTab", createSceneButton); //for sidebar stuff on left


Hooks.on("renderJournalSheet", (app, html, options) => {
	//find all img and video tags in the html, and add the clickableImage class to all of them
	console.log(app.object + " vs " + displayJournal);
	if(app.object != displayJournal){
		//unless it's a display journal, as we don't want it clickable
		html.find('img').attr("class", "clickableImage");
		html.find('video').attr("class", "clickableImage");
		//find the lightbox images for the 'image' journal mode as well and do the same as above
		html.find(".lightbox-image").each((i, div) => {
			div.classList.add("clickableImage");
		})
}

	setEventListeners(html);
  	if(FindDisplayJournal() && app.object == displayJournal){
        //the image that will be changed 
        journalImage = html.find(".lightbox-image");
    }

});

Hooks.once('init', async function(){
	console.log("Initializing Journal to Canvas Slideshow");
	registerSettings();
});
Hooks.once('ready', ()=>{
	FindDisplayJournal();
	DisplaySceneFound();
});