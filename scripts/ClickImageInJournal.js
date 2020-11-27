console.log("Hello world! This code runs immediately when the file is loaded");

var displayScene;
var displayTile;

Hooks.on("ready", ()  =>{

	//if there isn't already a display scene
	if (!DisplaySceneFound()){
		//if there is no display scene or it's undefined
		//generate a new one
		GenerateDisplayScene();
	}
	else{
		console.log("Display scene already exists :)");
	}
});

Hooks.on("renderJournalSheet", (app, html, options) => {
	html.find('img').attr("class", "clickableImage");
	html.find('.clickableImage').each((i, div) => {
		div.addEventListener("click", /*findClickableImage*/ displayImage, false);
		div.addEventListener("mouseover", highlight, false);
		div.addEventListener("mouseout", dehighlight, false);
	});
	console.log("A journal sheet has opened");
	//findClickableImage(html);
});

function highlight(ev) {
	ev.target.style.borderStyle = "solid"; //css("border-style", "solid", "border-color", "white", "border-width", "4px");
	ev.target.style.borderColor = "white";
	ev.target.style.borderWidth = "4px";
}

function dehighlight(ev) {
	ev.target.style.borderStyle = "none";
}

async function findClickableImage(ev) {
	let element = ev.currentTarget;
	let url = element.src;

	const data = {
		type: "image",
		src: url
	};
	let tileData = {
		img: data.src
	};
	const tex = await loadTexture(data.src);

	var dimensionObject = calculateAspectRatioFit(tex.width, tex.height, canvas.dimensions.sceneWidth, canvas.dimensions.sceneHeight);
	tileData.width = dimensionObject.width;
	tileData.height = dimensionObject.height;
	var displayTile = canvas.tiles.placeables[0];
	//https://stackoverflow.com/questions/38675447/how-do-i-get-the-center-of-an-image-in-javascript
	if (dimensionObject.height > dimensionObject.width) {
		//half of the scene's width or height is the center -- we're subtracting by half of the image's width or height to account for the offset because it's measuring from top/left instead of center
		displayTile.update({
			width: dimensionObject.width,
			height: dimensionObject.height,
			img: url,
			y: 0,
			x: (canvas.dimensions.sceneWidth / 2) - (dimensionObject.width / 2)
		});
	} else if (dimensionObject.width > dimensionObject.height) {
		displayTile.update({
			width: dimensionObject.width,
			height: dimensionObject.height,
			img: url,
			x: 0,
			y: canvas.dimensions.sceneHeight / 2 - (dimensionObject.height / 2)
		});
	}
	//canvas.tiles.placeables[0].update({width: dimensionObject.width, height: dimensionObject.height, img: url});
	/*canvas.tiles.placeables[0].data.width = dimensionObject.width;
	canvas.tiles.placeables[0].data.height = dimensionObject.height;
	canvas.tiles.placeables[0].data.img = url;*/
	/*tileData.x = canvas.dimensions.sceneRect.x;// canvas.dimensions.sceneWidth/2;//canvas.stage.scale.x/2;
		tileData.y = canvas.dimensions.sceneRect.y;//canvas.dimensions.sceneHeight/2;//canvas.stage.scale.y/2;
        Tile.create(tileData);*/

	//if it's a tall image rather than a wide image
	/*if(displayTile.data.height > displayTile.data.width){
		displayTile.update({y: canvas.dimensions.sceneHeight/4, x: 0});
	}
	//if it's a wide image
	else if(displayTile.data.width > displayTile.data.height){
		displayTile.update({x: canvas.dimensions.sceneWidth/4, y: 0});
	}*/

}

async function displayImage(ev) {
	if(DisplaySceneFound()){
		displayScene.activate();
	}
	else{
		console.log("No display scene");
	}
	let element = ev.currentTarget;
	let url = element.src;

	const data = {
		type: "image",
		src: url
	};
	let tileData = {
		img: data.src
	};
	const tex = await loadTexture(data.src);

	var dimensionObject = calculateAspectRatioFit(tex.width, tex.height, canvas.dimensions.sceneWidth, canvas.dimensions.sceneHeight);
	//DisplaySceneFound();
	tileData.width = dimensionObject.width;
	tileData.height = dimensionObject.height;
	var displayTile = displayScene.getEmbeddedCollection("Tile")[0];//canvas.tiles.placeables[0];
	console.log(displayTile);

	//half of the scene's width or height is the center -- we're subtracting by half of the image's width or height to account for the offset because it's measuring from top/left instead of center
	console.log(displayScene);
	var wideImageUpdate = {
		_id: displayTile._id,
		width: dimensionObject.width,
		height: dimensionObject.height,
		img: url,
		x: 0,
		y: (displayScene.data.height / 2) - (dimensionObject.height / 2)
	};
	var tallImageUpdate = {
		_id: displayTile._id,
		width: dimensionObject.width,
		height: dimensionObject.height,
		img: url,
		y: 0,
		x: (displayScene.data.width / 2) - (dimensionObject.width / 2)
	};
	//https://stackoverflow.com/questions/38675447/how-do-i-get-the-center-of-an-image-in-javascript
	if (dimensionObject.height > dimensionObject.width) {
		const updated = await displayScene.updateEmbeddedEntity("Tile", tallImageUpdate);
	} else if (dimensionObject.width > dimensionObject.height) {
		const updated = await displayScene.updateEmbeddedEntity("Tile", wideImageUpdate);
	}
}

async function GenerateDisplayScene() {
	//create a Display" scene 
	//set the scene to 2000 by 2000, and set the background color to a dark gray
	if (displayScene == null) {
		displayScene = await Scene.create({
			name: "Display",
			width: 2000,
			height: 2000,
			backgroundColor: "#202020"
		});
		displayTile = Tile.create({
			width: 2000,
			height: 1000,
			x: 0,
			y: (canvas.dimensions.sceneWidth / 2) - (dimensionObject.width / 2)
		});
	}

	//let display = await Scene.create({name: "Display", width: 2000, height: 2000, backgroundColor: "#202020"});
	//const display = new Scene();
	//	display.update({width: 2000, height: 2000, backgroundColor: "#202020"});
}

function DisplaySceneFound() {
	// getting the scenes, we want to make sure the tile only happens on the particular display scene
	// so we want it to update on the specific scene and no others
	var scenes = game.scenes.entries;
	var displaySceneFound = false;
	for (var scn of scenes) {
		if (scn.name == "Display") {
			displayScene = scn;
			displaySceneFound = true;
		}
	}
	return displaySceneFound;

}

/*https://stackoverflow.com/questions/3971841/how-to-resize-images-proportionally-keeping-the-aspect-ratio*/
function calculateAspectRatioFit(srcWidth, srcHeight, maxWidth, maxHeight) {
	var ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
	return {
		width: srcWidth * ratio,
		height: srcHeight * ratio
	};

}