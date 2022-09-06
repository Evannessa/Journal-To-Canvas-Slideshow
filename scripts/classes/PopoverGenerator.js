"use strict";
import { HelperFunctions } from "./HelperFunctions.js";
export class Popover {
    static defaultElementData = {
        popoverElement: {
            target: null,
            hideEvents: [],
        },
        sourceElement: {
            target: null,
            hideEvents: [],
        },
        parentElement: {
            target: null,
            hideEvents: [],
        },
    };
    static async processPopoverData(
        sourceElement,
        parentElement,
        templateData,
        elementData = Popover.defaultElementData,
        sourceEvent = ""
    ) {
        // -- RENDER THE POPOVER
        elementData.parentElement.target = parentElement;
        elementData.sourceElement.target = sourceElement;

        let elementDataArray = Object.keys(elementData).map((key) => {
            let newData = elementData[key];
            newData.name = key;
            return newData;
        });

        let popover = await Popover.createAndPositionPopover(templateData, elementDataArray, sourceEvent);
        console.log("Popover got rendered", popover);

        return popover;
    }

    /**
     *
     * @param {Event} event - the event (usually hover) that generated the tooltip
     * @param {JQueryObject} $html - the html of the entire app
     * @param {String} dataElementSelector - a string to select the parent element with the relevant data for this tooltip
     */
    static async generateTooltip(event, $html, dataElementSelector, sourceEvent) {
        if (!$html.jquery) $html = $($html);

        let sourceElement = event.currentTarget;
        let parentDataElement = sourceElement.closest(dataElementSelector);

        let templateData = Popover.createTemplateData(parentDataElement, "tooltip", {
            content: sourceElement.dataset.tooltipText,
        });
        let popover = await Popover.processPopoverData(
            sourceElement,
            $html,
            templateData,
            {
                ...Popover.defaultElementData,
            },
            sourceEvent
        );
        let eventString = "mouseenter mouseleave";
        let selectorString = `[data-tooltip], .popover[data-popover-id="tooltip"]`;
        $html.off(eventString, selectorString).on(eventString, selectorString, async (event) => {
            let { type, currentTarget } = event;
            let isMouseOver = type === "mouseover" || type === "mouseenter";
            !currentTarget.jquery && (currentTarget = $(currentTarget));

            //if our current target is our source element or the popover itself
            if (currentTarget.is($(sourceElement)) || currentTarget.is($(popover))) {
                if (!popover.hoveredElements) popover.hoveredElements = [];
                let { hoveredElements } = popover;
                let isInArray = Popover.JqObjectInArray(hoveredElements, currentTarget);
                if (isMouseOver) {
                    //if we're already tracking it, remove it
                    if (!isInArray) {
                        hoveredElements.push(currentTarget);
                    } else {
                    }
                    popover.hoveredElements = hoveredElements;
                } else {
                    if (isInArray) {
                        //if we're already tracking it, remove it
                        hoveredElements = hoveredElements.filter((el) => !el.is(currentTarget));
                    }
                    popover.hoveredElements = hoveredElements;
                    if (popover.hoveredElements.length === 0) {
                        await Popover.hideAndDeletePopover(popover);
                    }
                }
            }
        });
    }

    static JqObjectInArray(objectArray, searchObject) {
        let isIncluded = false;
        objectArray.forEach((obj) => {
            if (obj.is(searchObject)) {
                isIncluded = true;
            }
        });
        return isIncluded;
    }

    static createTemplateData(parentLI, partialName, context = {}) {
        let template = { frameId: "", id: "", type: "" };
        let dataset = filterObject($(parentLI).data(), template);
        if (!dataset) {
            dataset = {};
        }
        let popoverId = partialName;

        dataset.popoverId = popoverId; //to keep there from being multiples of the same popover
        return {
            passedPartial: partialName,
            dataset: dataset,
            passedPartialContext: context,
        };
    }

    static validateInput(inputValue, validationType, onInvalid = "") {
        let valid = false;
        switch (validationType) {
            case "image":
                valid = HelperFunctions.isImage(inputValue);
                break;
            default:
                valid = inputValue !== undefined;
                break;
        }
        return valid;
    }

    /**
     * Generates a popover (tooltip, etc), and positions it from the source element
     * boundingClientRect data
     * @param {Object} templateData - the data to be passed to the popover
     * @param {Application} parentApp - the parent application rendering the popover
     * @param {HTMLElement} sourceElement - the element that is the "source" of the popover (a button, input, etc.)
     */
    static async createAndPositionPopover(templateData, elementDataArray = [], sourceEvent = "") {
        let elements = elementDataArray.map((data) => data.target);
        let [popoverElement, sourceElement, parentElement] = elements; //destructure the passed-in elements

        let boundingRect = sourceElement.getBoundingClientRect();

        let popoverTemplate = game.JTCS.templates["popover"];
        popoverElement = parentElement.find(`.popover[data-popover-id="${templateData.dataset.popoverId}"]`);

        if (popoverElement.length === 0) {
            //if it doesn't already exist, create it
            let renderedHTML = await renderTemplate(popoverTemplate, templateData);
            parentElement.append(renderedHTML);
            popoverElement = parentElement.find(`.popover[data-popover-id="${templateData.dataset.popoverId}"`);
        }

        let popoverData = elementDataArray.find((data) => data.name === "popoverElement");

        popoverData.target = popoverElement;

        popoverElement.css({ position: "absolute" });
        popoverElement.offset({ top: boundingRect.top + boundingRect.height, left: boundingRect.left });
        popoverElement.focus({ focusVisible: true });

        //set up a "Click Out" event handler

        // //hideEvents should be list of events to hide the popover on (like blur, change, mouseout, etc)
        // elementDataArray.forEach((data) => {
        //     let targetElement = data.target;

        //     data.hideEvents.forEach((eventData) => {
        //         let handler;
        //         let selector;
        //         let eventName;
        //         let options;

        //         if (typeof eventData === "string") {
        //             //if it's a simple string, just set the handler to immediaetly hide the popover on this event
        //             eventName = eventData;
        //             handler = async (event) => await Popover.hideAndDeletePopover(popoverElement);
        //             selector = "*";
        //         } else if (typeof eventData === "object") {
        //             //if it's an object, we'll want to do something (like validate input) first before hiding
        //             eventName = eventData.eventName;

        //             //pass the popover element and the hide function to the wrapperFunction
        //             options = {
        //                 ...eventData.options,
        //                 popover: popoverElement,
        //                 hideFunction: Popover.hideAndDeletePopover,
        //             };
        //             handler = async (event, options) => {
        //                 await eventData.wrapperFunction(event, options);
        //             };
        //             selector = eventData.selector;
        //         }
        //         $(targetElement)
        //             .off(eventName, selector)
        //             .on(eventName, selector, async (event) => await handler(event, options));
        //     });
        // });
        // let popoverID = popoverElement.data().popoverId;
        $(document)
            .off("click")
            .on("click", async (event) => {
                //make sure the button that originated the click wasn't
                //the same one being handled by this document
                if (Popover.isOutsideClick(event, sourceElement)) {
                    await Popover.hideAndDeletePopover(popoverElement);
                }
            });

        return popoverElement;
    }

    static isOutsideClick(event, sourceElement) {
        let wasOnPopover = $(event.target).closest(".popover").length > 0;
        let wasOnSourceElement = $(event.target).is($(sourceElement));
        if (wasOnPopover || wasOnSourceElement) {
            //click was on the popover
            return false;
        }
        //if our click is outside of our popover element
        return true;
    }

    static async hideAndDeletePopover(popoverElement) {
        // popoverElement.addClass("hidden");
        //TODO: Put some sort of fading animation here
        if (popoverElement.timeout) {
            //if the popover is already counting down to a timeout, cancel it
            clearTimeout(popoverElement.timeout);
        }
        let popoverTimeout = setTimeout(() => {
            //set a new timeout to remove the popover
            popoverElement.remove();
        }, 900);
        //save that timeout's id on the popover
        popoverElement.timeout = popoverTimeout;
    }
}
