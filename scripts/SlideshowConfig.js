Hooks.on("renderApplication", (app) => {
    // console.log(app);
});

export class SlideshowConfig extends FormApplication {
    constructor(data) {
        super();
        this.data = data;
    }
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["form"],
            popOut: true,
            template: "modules/journal-to-canvas-slideshow/templates/config.html",
            id: "slideshow-config",
            title: "Slideshow Config",
        });
    }

    getData() {
        //return data to template
        return {
            shouldActivateDisplayScene: this.shouldActivateDisplayScene,
        };
    }

    activateListeners(html) {
        super.activateListeners(html);
    }

    async _updateObject(event, formData) {}
}

window.SlideshowConfig = SlideshowConfig;
