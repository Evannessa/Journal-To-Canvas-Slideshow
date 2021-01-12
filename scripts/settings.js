export const registerSettings = function() {
game.settings.register("journal-to-canvas-slideshow", "scaleDown", {
	name: "Scale Down",
	hint: "How many pixels from the edges of the canvas would you like your image scaled",
	scope: "client",
	config: true,
	type: Number,
	default: 200,
	onChange: changeScaleValue

});

game.settings.register("journal-to-canvas-slideshow", "displayLocation", {
	name: "Display Location",
	hint: "Display journal images in a scene (default) or in a popout",
	scope: "client",
	config: true,
	type: String,
	choices: {
		"scene": "0",
		"popout": "1"
	},
	default: "scene",
	onChange: changeScaleValue
});


game.settings.register("journal-to-canvas-slideshow", "activateDisplayScene", {
    name: "Activate display scene",
    hint: "Automatically activate the display scene after clicking on an image?",
    scope: "client",
    config: true,
    type: Boolean,
    default: false,
    onChange: changeScaleValue

});


}
function changeScaleValue(){
    console.log("Journal to canvas slideshow setting changed");
}