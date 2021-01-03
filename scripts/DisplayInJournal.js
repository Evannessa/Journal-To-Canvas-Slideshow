let displayJournal;
let journalImage;

function FindDisplayJournal(){
    let journalEntries = game.journal.entries;
    let foundDisplayJournal = false;
    journalEntries.forEach( element => {
        //go through elements. If found, set bool to true. If not, it'll remain false. Return.
        if(element.name == "Display Journal"){
            displayJournal = element;
            foundDisplayJournal = true;
        }
    });
    return foundDisplayJournal;

}

function CreateDisplayJournal(){


}

function ChangeDisplayImage(url){
    //get the url from the image clicked in the journal
    if(!FindDisplayJournal()){
        //couldn't find display journal, so return
        ui.notifications.error("No display journal found");
        return;
    }
    //change the background image to be the clicked image in the journal
    journalImage.style.backgroundImage = `url(${url})`;


}

Hooks.on("renderJournalSheet", (app, html, options) => {
    console.log(displayJournal + " vs " + app.object);
    if(FindDisplayJournal() && app.object == displayJournal){
        //the image that will be changed 
        journalImage = html.find(".lightbox-image");
    }
})