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

game.settings.register("journal-to-canvas-slideshow", "displayWindowBehavior", {
	name: "Display Window Behavior",
	hint: "Would you like the display window to be a dedicated journal entry (which cannot display video), or a new popout window that appears each time you click on an image (any previous display popout will close). Note that the dedicated journal entry option cannot display video files for now, but the new window popout can.",
	scope: "client",
	config: true,
	type: String,
	choices: {
		"journalEntry": "Dedicated Journal Entry",
		"newWindow": "New Window",
	},
	default: "journalEntry"


});

game.settings.register("journal-to-canvas-slideshow", "showWelcomeMessage", {
	name: "Show Welcome Message",
	scope: "client",
	type: Boolean,
	config: true,
	default: true
});
// game.settings.register("journal-to-canvas-slideshow", "useDisplayScene", {
// 	name: "Use Display Scene",
// 	hint: "Would you like to user the display scene, or use a bounding tile in a different scene?",
// 	scope: "client",
// 	config: true,
// 	type: Boolean,
// 	default: true
// });
// // game.settings.register("journal-to-canvas-slideshow", "displayJournal", {
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
