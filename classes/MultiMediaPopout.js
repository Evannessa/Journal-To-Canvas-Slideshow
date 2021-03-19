/* Code below written by zeelo1 https://github.com/zeel01/TokenHUDArtButton/blob/master/artbutton.js -- to handle videos in the popout
/* with some tweaks to fit my module
/**
 * Capable of handling images, as well as .mp4 and .webm video
 * not very sophisticated.
 *
 * @class MultiMediaPopout
 * @extends {ImagePopout}
 */

export default class ImageVideoPopout extends ImagePopout {
	/**
	 * Creates an instance of MultiMediaPopout.
	 *
	 * @param {string} src
	 * @param {object} [options={}]
	 * @memberof MultiMediaPopout
	 */
	constructor(src, options = {}) {
		super(src, options);

		this.video = [".mp4", "webm"].includes(
			src.slice(-4).toLowerCase()
		);

		this.options.template = "modules/journal-to-canvas-slideshow/templates/media-popout.html";
	}

	/** @override */
	async getData(options) {
		let data = await super.getData();
		data.isVideo = this.video;
		return data;
	}
	/**
	* Share the displayed image with other connected Users
	*/
	shareImage() {
		game.socket.emit("module.token-hud-art-button", {
			image: this.object,
			title: this.options.title,
			uuid: this.options.uuid
		});
	}

	/**
	 * Handle a received request to display media.
	 *
	 * @override
	 * @param {string} image - The path to the image/media resource.
	 * @param {string} title - The title for the popout title bar.
	 * @param {string} uuid
	 * @return {ImageVideoPopout}
	 * @private
	 */
	static _handleShareMedia({ image, title, uuid } = {}) {
		return new ImageVideoPopout(image, {
			title: title,
			uuid: uuid,
			shareable: false,
			editable: false
		}).render(true);
	}
}


Hooks.once("ready", () => {
	game.socket.on("module.token-hud-art-button", ImageVideoPopout._handleShareMedia);
});