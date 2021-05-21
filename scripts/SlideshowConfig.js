export class SlideshowConfig extends FormApplication {
    constructor(exampleOption){
        super();
        this.exampleOption = exampleOption;
    }
    static get defaultOptions(){
        return mergeObject(super.defaultOptions, {
            classes: ['form'],
            popOut: true,
            template: "modules/journal-to-canvas-slideshow/templates/config.html",
            id: 'slideshow-config',
            title: 'Slideshow Config',
           
        });
    }

    getData(){
        //return data to template
        return {
            msg: this.exampleOption,
            color: 'red',
        }
    }

    activateListeners(html){
        super.activateListeners(html);
    }

    async _updateObject(event, formData){
        console.log(formData.exampleInput);
    }
}

    window.SlideshowConfig = SlideshowConfig;
