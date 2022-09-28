const validatorExpressions = {
    noWhitespaceStart: /^[\S]+/,
};
const notificationIcons = {
    danger: "fas fa-exclamation-circle",
    warning: "fas fa-exclamation-triangle",
};

/**
 * Hide (or show) all of an element's sibling elements
 * @param {event} event - the event that triggered this
 */
function toggleHideAllSiblings(event, currentTarget) {
    if (!currentTarget) currentTarget = event.currentTarget;

    const siblings = Array.from(currentTarget.parentNode.children).filter((item) => !item.isSameNode(currentTarget));

    if (currentTarget.classList.contains("active")) {
        siblings.forEach((el) => el.classList.remove("hidden"));
    } else {
        siblings.forEach((el) => el.classList.add("hidden"));
    }
}

function fadeSheetOpacity(event, selector = ".window-content") {
    event.preventDefault();

    const windowContent = event.currentTarget.closest(selector);
    const faded = windowContent.classList.contains("fade") || windowContent.classList.contains("fade-all");

    if (faded) {
        windowContent.classList.remove("fade");
    } else {
        windowContent.classList.add("fade");
    }
}
/**
 * Insert a notification inline
 * @param {*} event - the event that triggered this notification
 * @param {*} ancestorSelector - the ancestor element into which we want to insert this notification element
 * @param {Object} options - options to customize this notification
 * @param {String} options.message - the notification message
 * @param {String} options.notificationType - the type of notification, to affect its icon and styling
 */
async function renderInlineNotification(event, ancestorSelector = "formGroup", options = {}) {
    let { notificationType, icon } = options;
    if (!icon) {
        if (notificationType) {
            options.icon = notificationIcons[notificationType];
        } else {
            notificationType = "error";
            options.icon = notificationIcons[notificationType];
        }
    }
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
    let { duration, isFadeOut, onFadeOut, onCancel } = setAnimDefaults(options);

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
    fadeAnim.addEventListener("cancel", (event) => {
        if (onCancel) {
            onCancel($element, event);
        }
    });
    return fadeAnim;
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
function toggleActiveStyles(event, el) {
    if (!el) el = event.currentTarget;
    el.classList.toggle("active");
}
/**
 * Turn off other elements that have active styles
 * @param {HTMLEvent} event - the triggering event
 * @param {Element} el - the element on which to apply the active styles
 * @param {String} otherSelector - a selector to find other elements that are set to "active"
 */
function clearOtherActiveStyles(event, el, otherSelector, parentSelector) {
    const parentItem = el.closest(parentSelector);
    let others = Array.from(parentItem.querySelectorAll(otherSelector)).filter((item) => !item.isSameNode(el));
    others.forEach((other) => console.log(other, el, other.isSameNode(el)));
    others = others.filter((other) => other.classList.contains("active"));

    console.log("%cUniversal-Actions.js line:119 others", "color: white; background-color: #007acc;", others);

    others.forEach((other) => toggleActiveStyles(event, other));
}
export const universalInterfaceActions = {
    /**
     *
     * Show or hide another element
     * @param {HTMLEvent} event - the event that provoked this
     * @param {Object} options - options object
     * @param {HTMLElement} options.parentItem - the parent item in which to find the element we want to hide/show
     * @param {String} options.targetClassSelector - the class of the item we want to show
     */
    toggleShowAnotherElement: (event, options) => {
        let { parentItem, targetClassSelector, fadeIn = true } = options;
        let el = event.currentTarget;
        let targetID = el?.dataset.targetId;
        let target;
        if (targetID) {
            target = parentItem.querySelector(`#${targetID}`);
        } else {
            target = parentItem.querySelector(`.${targetClassSelector}`);
        }
        if (target) {
            if (fadeIn) {
                handleVisibilityTransitions($(target));
            } else {
                $(target).removeClass("hidden");
            }
        }
    },
    toggleActiveStyles: toggleActiveStyles,
    clearOtherActiveStyles: clearOtherActiveStyles,
    fadeSheetOpacity: fadeSheetOpacity,
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
    toggleHideAllSiblings,
    scrollOtherElementIntoView: (event, options) => {
        const { parentItem: $parentItem } = options;
        let currentTarget = event.currentTarget;
        let scrollTargetID = currentTarget.dataset.target;
        let scrollTarget = $parentItem.find(`#${scrollTargetID}`);
        scrollTarget[0].scrollIntoView();
        clearOtherActiveStyles(event, currentTarget, "[data-action='scrollTo']", "#JTCSsettingsHeader");
        toggleActiveStyles(event, currentTarget);
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
