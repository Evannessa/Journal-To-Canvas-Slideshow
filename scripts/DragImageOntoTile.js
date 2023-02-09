//https://github.com/cswendrowski/FoundryVTT-Drag-Upload/blob/master/dragupload.js
Hooks.once("ready", async function () {
    // Setup variables and folders
    await initializeDragUpload();

    // Enable binding
    new DragDrop({
        callbacks: {
            drop: handleDrop,
        },
    }).bind(document.getElementById("board"));
});
async function handleDrop(event) {
    event.preventDefault();
    console.log(event);

    const files = event.dataTransfer.files;
    console.log(files);

    let file;
    if (!files || files.length === 0) {
        let url = event.dataTransfer.getData("Text");
        if (!url) {
            console.log("DragUpload | No Files detected, exiting");
            // Let Foundry handle the event instead
            canvas._onDrop(event);
            return;
        }
        // trimming query string
        if (url.includes("?")) url = url.substr(0, url.indexOf("?"));
        const splitUrl = url.split("/");
        let filename = splitUrl[splitUrl.length - 1];
        if (!filename.includes(".")) {
            console.log("DragUpload | Dragged non-file text:", url);
            // Let Foundry handle the event instead
            canvas._onDrop(event);
            return;
        }
        const extension = filename.substr(filename.lastIndexOf(".") + 1);
        const validExtensions = Object.keys(CONST.IMAGE_FILE_EXTENSIONS)
            .concat(Object.keys(CONST.VIDEO_FILE_EXTENSIONS))
            .concat(Object.keys(CONST.AUDIO_FILE_EXTENSIONS));
        if (!validExtensions.includes(extension)) {
            console.log("DragUpload | Dragged file with bad extension:", url);
            // Let Foundry handle the event instead
            canvas._onDrop(event);
            return;
        }
        // special case: chrome imgur drag from an album gives a low-res webp file instead of a PNG
        if (url.includes("imgur") && filename.endsWith("_d.webp")) {
            filename = filename.substr(0, filename.length - "_d.webp".length) + ".png";
            url = url.substr(0, url.length - "_d.webp".length) + ".png";
        }
        // must be a valid file URL!
        file = { isExternalUrl: true, url: url, name: filename };
    } else {
        file = files[0];
    }

    if (file == undefined) {
        // Let Foundry handle the event instead
        canvas._onDrop(event);
        return;
    }
    console.log(file);

    if (Object.keys(CONST.AUDIO_FILE_EXTENSIONS).filter((x) => x != "webm" && file.name.endsWith(x)).length > 0) {
        await HandleAudioFile(event, file);
        return;
    }
    const layer = game.canvas.activeLayer.name;
}
