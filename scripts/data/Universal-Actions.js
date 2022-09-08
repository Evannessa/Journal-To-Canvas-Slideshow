export const universalInterfaceActions = {
    toggleShowAnotherElement: (event, options) => {
        let { html, parentItem } = options;
        let el = event.currentTarget;
        let targetID = el.dataset.targetId;
        let target = parentItem.querySelector(`#${targetID}`);
        target?.classList.toggle("hidden");
    },
    toggleActiveStyles: (event) => {
        let el = event.currentTarget;
        el.classList.toggle("active");
    },
    toggleHideSelf: (event) => {
        let el = event.currentTarget;
        el.classList.toggle("hidden");
    },
    toggleHideAncestor: (event, options) => {
        let { ancestorSelector } = options;
        let el = event.currentTarget;
        el.closest(ancestorSelector).classList.toggle("hidden");
        // parentItem.classList.toggle("hidden");
    },
    renderAnotherApp: (appName, constructor) => {
        //if global variable's not initialized, initialize it
        if (!game[appName]) game[appName] = new constructor();
        //if it's not rendered, render it
        console.log(game[appName]);
        if (!game[appName].rendered) {
            game[appName].render(true);
        } else {
            //if it is rendered, bring it to the top
            game[appName].bringToTop();
        }
    },
};
