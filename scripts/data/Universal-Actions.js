const validatorExpressions = {
    noWhitespaceStart: /^[\S]+/,
};
const notificationIcons = {
    danger: "fas fa-exclamation-circle",
    warning: "fas fa-exclamation-triangle",
};
async function renderInlineNotification(event, ancestorSelector = "formGroup", options = {}) {
    const parentItem = event.currentTarget.closest(`.${ancestorSelector}`);
    let template = game.JTCS.templates["notification-badge"];
    let renderHTML = await renderTemplate(template, options);
    parentItem.insertAdjacentHTML("beforeend", renderHTML);
}
export const universalInterfaceActions = {
    toggleShowAnotherElement: (event, options) => {
        let { parentItem, targetClassSelector } = options;
        let el = event.currentTarget;
        let targetID = el.dataset.targetId;
        let target;
        if (targetID) {
            target = parentItem.querySelector(`#${targetID}`);
        } else {
            target = parentItem.querySelector(`.${targetClassSelector}`);
        }
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
        if (!game[appName].rendered) {
            game[appName].render(true);
            // window[appName] = constructor;
        } else {
            //if it is rendered, bring it to the top
            game[appName].bringToTop();
        }
    },
    renderInlineNotification: renderInlineNotification,
    // showInputNotification: (event, options) => {
    //     //show
    //     let { message, notificationType } = options;
    //     const parentItem = event.currentTarget.closest(".form-group");
    //     let options = {
    //         parentItem,
    //         targetClassSelector: "notification",
    //     };
    //     toggleShowAnotherElement(event, options);
    // },
    validateInput: async (
        event,
        validators = {
            noWhitespaceStart: {
                notificationType: "error",
                message: "Please enter a value that doesn't start with a white space",
            },
        }
    ) => {
        const { value } = event.currentTarget;
        const validatorKeys = Object.keys(validators);
        let allValid = true;
        /// do validation here
        let firstInvalidObject = {};
        validatorKeys.forEach((key) => {
            const regexp = validatorExpressions[key];
            let isValid = regexp.test(value);
            if (!isValid) {
                //if one expression doesn't match
                //set the full "allValid" boolean to false
                allValid = false;
                firstInvalidObject = validators[key];
                let { notificationType: type } = firstInvalidObject;
                firstInvalidObject.icon = notificationIcons[type];
            }
        });

        //if one of the validators returns invalid, show a notification
        if (!allValid) {
            await renderInlineNotification(event, "form-group", firstInvalidObject);
            // showInputNotification(event, options);
        }
        console.log("Returning all valid which is", allValid);
        return allValid;
    },
};
