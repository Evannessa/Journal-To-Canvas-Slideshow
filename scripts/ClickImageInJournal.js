function setEventListeners(html, app) {
    //look for the images and videos with the clickable image class, and add event listeners for being hovered over (to highlight and dehighlight),
    //and event listeners for the "displayImage" function when clicked
    // execute(html, app);
    wait().then(execute.bind(null, [html, app]));
}

function wait(callback) {
    return new Promise(function (resolve, reject) {
        resolve();
    });
}

function execute(args) {
    let [html, app] = args;

    // this one is for actor sheets. Right click to keep it from conflicting with the default behavior of selecting an image for the actor.
    if (checkSettingEquals("useActorSheetImages", true)) {
        html.find(".rightClickableImage").each((i, img) => {
            img.addEventListener("contextmenu", (event) => determineLocation(event, app), false);
        });
    }
}
