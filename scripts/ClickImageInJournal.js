console.log("Hello world! This code runs immediately when the file is loaded");





	var displayScene;
	var displayTile;
	function highlight(ev) {
		ev.target.style.borderStyle = "solid"; //css("border-style", "solid", "border-color", "white", "border-width", "4px");
		ev.target.style.borderColor = "white";
		ev.target.style.borderWidth = "4px";
	}

	function dehighlight(ev) {
		ev.target.style.borderStyle = "none";
	}



	async function displayImage(ev) {
		if (DisplaySceneFound()) {
			displayScene.activate();
		} else {
			console.log("No display scene");
			return;
		}
		// if(displayTile == null){
		// 	displayTile = await Tile.create({
		// 	img: "darkbackground.jpg",
		// 	width: 2000,
		// 	height: 1000,
		// 	y: 0,
		// 	x: 1000//(displayScene.data.width/ 2) - (dimensionObject.width / 2)
		// 	});
		// }
		let element = ev.currentTarget;
		let url = element.getAttribute("src");

		const data = {
			type: "image",
			src: url
		};
		let tileData = {
			img: data.src
		};
		const tex = await loadTexture(data.src);

		var dimensionObject = calculateAspectRatioFit(tex.width, tex.height, displayScene.data.width, displayScene.data.height);
		//DisplaySceneFound();
		tileData.width = dimensionObject.width;
		tileData.height = dimensionObject.height;
		var displayTile = displayScene.getEmbeddedCollection("Tile")[0]; //canvas.tiles.placeables[0];
		console.log(displayTile);
		var scaleDownFactor = 200;
		dimensionObject.width -= scaleDownFactor;
		dimensionObject.height -= scaleDownFactor;
		//half of the scene's width or height is the center -- we're subtracting by half of the image's width or height to account for the offset because it's measuring from top/left instead of center
		console.log(element.src);
		var wideImageUpdate = {
			_id: displayTile._id,
			width: dimensionObject.width,
			height: dimensionObject.height,
			img: url,
			x: scaleDownFactor/2,
			y: ((displayScene.data.height / 2) - (dimensionObject.height / 2))
		};
		var tallImageUpdate = {
			_id: displayTile._id,
			width: dimensionObject.width,
			height: dimensionObject.height,
			img: url,
			y: scaleDownFactor/2,
			x: ((displayScene.data.width / 2) - (dimensionObject.width / 2))
		};
		//https://stackoverflow.com/questions/38675447/how-do-i-get-the-center-of-an-image-in-javascript
		if (dimensionObject.height > dimensionObject.width) {
			const updated = await displayScene.updateEmbeddedEntity("Tile", tallImageUpdate);
		} else if (dimensionObject.width > dimensionObject.height) {
			const updated = await displayScene.updateEmbeddedEntity("Tile", wideImageUpdate);
		}
	}

	function createSceneButton(app, html) {
		if (!game.user.isGM) {
			return;
		}
		if (app.options.id == "scenes") {
			let button = $("<button>Create or Show Display Scene</button>");
			//if the display scene already exists, open and activate it; if not, create a new one
			button.click(GenerateDisplayScene); //GenerateDisplayScene());
			html.find(".directory-footer").prepend(button);
		}


	}



	

	async function GenerateDisplayScene() {
		//create a Display" scene 
		//set the scene to 2000 by 2000, and set the background color to a dark gray
		if (!DisplaySceneFound()) {
			displayScene = null;
			displayTile = null;
			console.log("Display scene " + displayScene);
			console.log("Generating new display scene");
			displayScene = await Scene.create({
				name: "Display",
				width: 100,
				height: 100,
				backgroundColor: "#202020",
				padding: 0
			});
			console.log(displayScene.data.width + " by " + displayScene.data.height);
			await displayScene.activate();
			console.log(canvas.scene);
			await displayScene.update({
				name: "Display",
				width: 2000,
				height: 2000,
				backgroundColor: "#202020",
				padding: 0
			});

			//create a tile for the scene
			console.log("Display Scene Dimensions" + displayScene.data.width + " by " + displayScene.data.height);
			const tex = await loadTexture("darkbackground.jpg");
			var dimensionObject = calculateAspectRatioFit(tex.width, tex.height, displayScene.data.width, displayScene.data.height);
			console.log("Texture dimensions " + tex.width + " by " + tex.height);
			console.log("Dimension Object dimensions " + dimensionObject.width + " by " + dimensionObject.height);
			displayTile = await Tile.create({
				img: "darkbackground.jpg",
				width: dimensionObject.width,
				height: dimensionObject.height,
				x: 0,
				y: (displayScene.data.height / 2) - (dimensionObject.height / 2)
			});
			console.log(displayScene.data.width + " By " + displayScene.data.height)	;
			canvas.draw();

		}
		else{
			console.log("Display scene already exists");
			//if the display scene exits already, just activate it
			displayScene.activate();

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
		console.log("Max width " + maxWidth + ", Max hieght " + maxHeight + ", Source width " + srcWidth + ", Source Height " + srcHeight);
		console.log("Ratio " + ratio + ", width " + srcWidth * ratio + ", height " + srcHeight * ratio);
		return {
			width: srcWidth * ratio,
			height: srcHeight * ratio
		};

	}

	function addImage(app, url, currentJournalId){
		var journalEntry;
		//create image tag with url of item
		var containerParagraph;//document.createElement("p");
		var image = new Image();//document.createElement("IMG");
		//append the child to the body of the journal entry -- gotta figure out how to add it to the journal entry specifically
		var journalDiv = document.getElementById(currentJournalId);

		var journalForm = journalDiv.getElementsByTagName("form")[0];
		var editorContent = journalForm.getElementsByClassName("editor-content")[0];
		containerParagraph = journalForm.getElementsByClassName("editor-content")[0].querySelector("p");//appendChild(containerParagraph);
		containerParagraph.appendChild(image);
		//journalForm.getElementsByClassName("editor-content")[0].appendChild(image);
		image.src = url;
		//console.log(editorContent.innerHTML);
		app.object.data.content = editorContent.innerHTML;
		console.log(app.object.data.content);
	//	let updated = await
		 app.object.update({content : app.object.data.content});

		 app.render(false, {});
		 app.object.prepareData();
	
	}

	function addImageToJournal(app, url){
		//THIS does not work --- it resets when you refresh. Need to find a better way to access it.
		app.object.data.content += "<img src=" + url + ">";
	}

	async function handleDrop(app, event, currentJournalId){
		event.preventDefault();

		var files = event.dataTransfer.files;
		file = files[0];
		CreateNewImage(app, file, currentJournalId);
	}

	async function CreateNewImage(app, file, currentJournalId){
		var source = "data";
		let response;
		if (file.isExternalUrl){
			response = {path: file.url}
			console.log("External Url Response path is " + response.path)
		}
		else{
			response = await FilePicker.upload(source, "tokens", file, {});
			console.log("ELSE Response path is " + response.path)
		}
		addImage(app, response.path, currentJournalId);
		//addImageToJournal(app, response.path);

	}


//Hooks.on("getSceneControlButtons", ClickImageInJournal.createSceneButton); //for scene control buttons on right
Hooks.on("renderSidebarTab", createSceneButton); //for sidebar stuff on left

// Hooks.on("ready", ()  =>{

// 	//if there isn't already a display scene
// 	if (!DisplaySceneFound()){
// 		//if there is no display scene or it's undefined
// 		//generate a new one
// 		GenerateDisplayScene();
// 	}
// 	else{
// 		console.log("Display scene already exists :)");
// 	}
// });


Hooks.on("renderJournalSheet", (app, html, options) => {
	//addImageToJournal(app, "1920x1080.jpg");
	console.log(app);
	console.log(html);
	var currentJournalId = html[0].id;
	console.log(options);
	html.find('img').attr("class", "clickableImage");
	document.querySelector("form.editable").addEventListener("drop", (event) => {
		console.log("Dropped something");
		handleDrop(app, event, currentJournalId);
		//_activateEditor()
		//html.find('editor-content[data-edit]').each((i, div) => { app._activateEditor(div)});
		//html.find('editor-content').each((i, div) => _activateEditor(div.get_attribute("data-edit")));
		//console.log(app.object.data.content);
		//app.object.update({content: app.object.data.content});
	});
	html.find('.clickableImage').each((i, div) => {
		div.addEventListener("click", /*findClickableImage*/ displayImage, false);
		div.addEventListener("mouseover", highlight, false);
		div.addEventListener("mouseout", dehighlight, false);
	});
	// document.getElementById("journal").addEventListener("drop", (event) => {


	// }

	//)
	console.log("A journal sheet has opened");
	//findClickableImage(html);
});