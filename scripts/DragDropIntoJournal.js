Hooks.once("init", async function () {});
let currentJournalId;

async function addImage(app, url, currentJournalId) {
    var journalEntry;
    //create image tag with url of item
    var containerParagraph;
    var image = new Image();
    //append the child to the body of the journal entry -- gotta figure out how to add it to the journal entry specifically
    var journalDiv = document.getElementById(currentJournalId);
    var journalForm = journalDiv.getElementsByTagName("form")[0];
    var editorContent = journalForm.getElementsByClassName("editor-content")[0];
    containerParagraph = journalForm.getElementsByClassName("editor-content")[0].querySelector("p"); //appendChild(containerParagraph);
    if (containerParagraph == null) {
        containerParagraph = document.createElement("p");
        journalForm.getElementsByClassName("editor-content")[0].appendChild(containerParagraph);
    }
    containerParagraph.appendChild(image);
    image.src = url;
    app.object.data.content = editorContent.innerHTML;
    app.object.update({
        content: app.object.data.content,
    });

    await app.submit();
}

async function handleDrop(app, event, currentJournalId) {
    event.preventDefault();

    var files = event.dataTransfer.files;
    for (let f of files) {
        checkSource(app, f, currentJournalId);
    }
}
//implemented and tweaked these methods from DragUpload by cswendrowski
//https://github.com/cswendrowski/FoundryVTT-Drag-Upload/blob/master/dragupload.js

async function checkSource(app, file, currentJournalId) {
    if (typeof ForgeVTT != "undefined" && ForgeVTT.usingTheForge) {
        source = "forgevtt";
    } else {
        var source = "data";
    }
    let response;
    if (file.isExternalUrl) {
        response = {
            path: file.url,
        };
    } else {
        response = await FilePicker.upload(
            source,
            game.settings.get("journal-to-canvas-slideshow", "imageSaveLocation"),
            file,
            {}
        );
    }
    addImage(app, response.path, currentJournalId);
}

Hooks.on("renderJournalSheet", (app, html, options) => {
    currentJournalId = html[0].id;
    var journalDiv = html[0];
    if (!journalDiv.querySelector("div.editor")) {
        return;
    }
    journalDiv.querySelector("div.editor").addEventListener("drop", (event) => {
        handleDrop(app, event, currentJournalId);
    });
});

Hooks.once("init", async function () {
    game.settings.register("DragDropIntoJournal", "imageSaveLocation", {
        name: "Image Save Location",
        hint: "Where in your Data folder would you like to save the images you drag into journal entries? Input the file path to your prefered folder here.",
        scope: "client",
        config: true,
        type: String,
        default: "",
    });
});
