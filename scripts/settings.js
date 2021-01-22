export const registerSettings = function() {
// game.settings.register("journal-to-canvas-slideshow", "scaleDown", {
// 	name: "Scale Down",
// 	hint: `How many pixels from the edges of the canvas to scale the canvas
// 	(This calculated from top/bottom or sides depending on if width or height of image is larger)"`,
// 	scope: "client",
// 	config: true,
// 	type: Number,
// 	default: 200,

// });

game.settings.register("journal-to-canvas-slideshow", "displayLocation", {
	name: "Display Location",
	hint: "Display clicked journal images in a scene (default) or in a separate journal window",
	scope: "client",
	config: true,
	type: String,
	choices: {
		"scene": "Scene",
		"window": "Window"
	},
	default: "scene",
//	onChange: swapDisplayModes
});


game.settings.register("journal-to-canvas-slideshow", "autoShowDisplay", {
    name: "Automatically Show Display",
    hint: "Automatically activate the 'Display' scene or show the 'Display Journal' to players after clicking on a journal image",
    scope: "client",
    config: true,
    type: Boolean,
    default: false,

});

// game.settings.register("journal-to-canvas-slideshow", "displayJournal", {
// 	name: "Display Journal",
// 	hint: "Which journal entry the display will show in",
// 	scope: "client",
// 	config: true,
// 	type: String,
// 	default: "",
// });

// game.settings.register("journal-to-canvas-slideshow", "displayScene", {
// 	name: "Display Scene",
// 	hint: "Which display scene will the images diaply in",
// 	scope: "client",
// 	config: true,
// 	type: String,
// 	default: "",

// });

}
