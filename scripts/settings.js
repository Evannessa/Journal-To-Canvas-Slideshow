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
	hint: "Display clicked journal images in a dedicated display scene (default), in a separate window, or in any scene using a bounding tile.",
	scope: "client",
	config: true,
	type: String,
	choices: {
		"displayScene": "Display Scene",
		"window": "Window",
		"anyScene": "Any Scene"
	},
	default: "displayScene",
//	onChange: swapDisplayModes
});


game.settings.register("journal-to-canvas-slideshow", "autoShowDisplay", {
    name: "Automatically Show Display",
    hint: "Automatically activate the 'Display' scene or show the Display Journal/Window to players after clicking on a journal image",
    scope: "client",
    config: true,
    type: Boolean,
    default: false,

});

game.settings.register("journal-to-canvas-slideshow", "displayName", {
	name: "Display Name",
	hint: "What would you like to name the display scene, journal, or window?",
	scope: "client",
	config: true,
	type: String,
	default: "Display"
});

game.settings.register("journal-to-canvas-slideshow", "useActorSheetImages",{
	name: "Use Actor Sheet Images",
	hint: "If this is enabled, you can RIGHT CLICK on an image in an actor sheet to display it to your players. This is set to right click so it doesn't conflict with the default behavior of clicking on an actor's image.",
	scope: "client",
	config: true,
	type: Boolean,
	default: false
});

game.settings.register("journal-to-canvas-slideshow", "displayWindowBehavior", {
	name: "Display Window Behavior",
	hint: "Would you like the display window to be a dedicated journal entry, or a new popout window that will appear each time you click on an image?",
	scope: "client",
	config: true,
	type: String,
	choices: {
		"journalEntry": "Dedicated Journal Entry",
		"newWindow": "New Window",
	},
	default: "journalEntry"


});

game.settings.register("journal-to-canvas-slideshow", "hideTileButtons", {
	name: "Hide Tile Buttons",
	hint: "Would you like to only show this module's scene control buttons in a separate window rather than all listed under the tile controls? \n This is so fewer buttons appear under the Tile control buttons \n Please switch to a different scene control and switch back if you activate this option to refresh the controls.",
	scope: "client",
	config: true,
	type: Boolean,
	default: false
});


game.settings.register("journal-to-canvas-slideshow", "showWelcomeMessage", {
	name: "Show Welcome Message",
	scope: "client",
	type: Boolean,
	config: true,
	default: true
});


}
