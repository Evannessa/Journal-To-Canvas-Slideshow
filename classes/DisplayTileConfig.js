export default class DisplayTileConfig extends FormApplication {
    static get defaultOptions() {
      return mergeObject(super.defaultOptions, {
      classes: ['form'],
      closeOnSubmit: false,
      submitOnChange: true,
      submitOnClose: true,
      popOut: true,
      editable: game.user.isGM,
      width: 500,
      template: 'modules/journal-to-canvas-slideshow/templates/config.html',//'modules/simplefog/templates/scene-config.html',
      id: 'display-scene-config',
      title: "Display Tile Configuration" //game.i18n.localize('Simplefog Options'),
    });
  }

    getData(){
        return {
            scaleDown: game.scenes.active.getFlag("world", "scaleDown"),//200, //scale down factor
            displayLocation: game.scenes.active.getFlag("world", "displayLocation"),
            // displayInScene: game.scenes.active.getFlag("world", "displayInScene"), //toggle for if you want it to display in a scene or a journal
            // displayInPopout: game.scenes.active.getFlag("world", "displayInPopout"),
            activateDisplayScene: game.scenes.active.getFlag("world", 'activateDisplayScene') //toggle for if you want the display scene to activate when you click on a journal image or not
        };
    }

    async _updateObject(event, formData){
      console.log(event);
      console.log(formData);
      Object.entries(formData).forEach(async ([key, val]) => {
        console.log(key, val);
        await game.scenes.active.setFlag("world", key, val);
      })
      if(event.submitter?.name ==='submit'){
        Object.values(ui.windows).forEach(val => {
          if(val.id ==='display-scene-config'){
            val.close();
          }
        });
      }
    }
}