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

function setAnimDefaults(animOptions) {
    const defaultOptions = {
        isFadeOut: false,
        duration: 300,
        onFadeOut: ($el, event) => {
            $el.remove();
        },
    };
    return mergeObject(defaultOptions, animOptions);
}
/**
 *
 * for fading objects in and out when they enter or exit the DOM
 * @param {JQuery} $element - Jquery object representing element to fade
 * @param {Object}  options - the options object
 * @param {Number} options.duration - default fade animation duration
 * @param {Boolean} options.isFadeOut - a boolean determining whether or not this should fade in our out
 * @param {Function} options.onFadeOut - the callback to handle what happens when the fade animation is complete
 */
async function fade($element, options = {}) {
    let { duration, isFadeOut, onFadeOut } = setAnimDefaults(options);
    console.log("Fading", $element, "With", options);

    let fadeAnim = $element[0].animate(
        [
            // keyframes
            { opacity: isFadeOut ? "100%" : "0%" },
            { opacity: isFadeOut ? "0%" : "100%" },
        ],
        {
            // timing options
            duration: duration,
        }
    );
    fadeAnim.addEventListener("finish", (event) => {
        if (isFadeOut) {
            onFadeOut($element, event);
        }
    });
}
/**
 * Handle the adding and removal of classes and triggering of animations to hide and fade elements
 * @param {JQuery} $element - the JQuery object representing DOM Element we want to show or hide
 */
async function handleVisibilityTransitions($element) {
    //if the class already has hidden, set it to fadeIn rather than out
    const isFadeOut = $element.hasClass("hidden") ? false : true;

    //if we're fading in, remove the hidden class
    if (!isFadeOut) $($element).removeClass("hidden");

    //set our fade animation options
    let options = {
        isFadeOut,
        onFadeOut: ($element, event) => $element.addClass("hidden"),
    };
    //handle the fade animation
    //? Fade will handle the opacity, while our "hidden" class handles everything else (transform, clip rect, position absolute, etc.)
    fade($($element), options);
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
        if (target) {
            handleVisibilityTransitions($(target));
        }
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
    fade,
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
