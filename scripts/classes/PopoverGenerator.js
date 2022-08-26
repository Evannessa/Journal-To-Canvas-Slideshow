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
        elementData = Popover.defaultElementData
    ) {
        // -- RENDER THE POPOVER
        elementData.parentElement.target = parentElement;
        elementData.sourceElement.target = sourceElement;

        let elementDataArray = Object.keys(elementData).map((key) => {
            let newData = elementData[key];
            newData.name = key;
            return newData;
        });

        let popover = await Popover.createAndPositionPopover(templateData, elementDataArray);
        return popover;
    }

    static hideBehavior = {
        hideOnMouseLeave: (event, type, popover) => {
            if (popover.timeout) {
                //if the popover is already counting down to a timeout, cancel it
                clearTimeout(popover.timeout);
            }
            let popoverTimeout = setTimeout(async () => {
                //set a new timeout to remove the popover
                console.log("Mouse leaving button, is on popover?", popover[0].isMouseOver);
                if (!popover[0].isMouseOver) {
                    await hideFunction(popover);
                }
            }, 900);
            //save that timeout's id on the popover
            popover.timeout = popoverTimeout;
        },
        hideOnOutsideClick: (event) => {
            if ($(event.target).closest(".popover").length) {
                //click was on the popover
                return false;
            }
            //if our click is outside of our popover element
            return true;
        },
    };

    /**
     *
     * @param {Event} event - the event (usually hover) that generated the tooltip
     * @param {JQueryObject} html - the html of the entire app
     * @param {String} dataElementSelector - a string to select the parent element with the relevant data for this tooltip
     */
    static async generateTooltip(event, html, dataElementSelector) {
        let element = event.currentTarget;

        let options = {
            html: html,
        };

        let context = {
            content: element.dataset.tooltipText,
        };

        let elementData = { ...Popover.defaultElementData };

        let parentDataElement = element.closest(dataElementSelector);
        let templateData = Popover.createTemplateData(parentDataElement, "tooltip", context);
        await Popover.processPopoverData(event, templateData, options, elementData);
    }

    static createTemplateData(parentLI, partialName, context = {}) {
        let dataset = $(parentLI).data();
        if (!dataset) {
            dataset = {};
        }
        dataset.popoverId = partialName; //to keep there from being multiples of the same popover
        return {
            passedPartial: partialName,
            dataset: dataset,
            passedPartialContext: context,
        };
    }
    static registerListeningElements(elementArray, eventName, listener) {
        elementArray.forEach((element) => {
            $(element).on(eventName);
        });
    }
    static setIsMouseOver(event) {
        let { type } = event;
        let element = event.currentTarget;
        switch (type) {
            case "mouseenter":
            case "mouseover":
                element.isMouseOver = true;
                break;
            case "mouseleave":
            case "mouseout":
                element.isMouseOver = false;
                break;
            default:
                break;
        }
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

    static getElementPositionAndDimension(element) {
        return {};
    }

    /**
     * Generates a popover (tooltip, etc), and positions it from the source element
     * boundingClientRect data
     * @param {Object} templateData - the data to be passed to the popover
     * @param {Application} parentApp - the parent application rendering the popover
     * @param {HTMLElement} sourceElement - the element that is the "source" of the popover (a button, input, etc.)
     */
    static async createAndPositionPopover(templateData, elementDataArray = []) {
        let elements = elementDataArray.map((data) => data.target);
        let [popoverElement, sourceElement, parentElement] = elements; //destructure the passed-in elements

        let boundingRect = sourceElement.getBoundingClientRect();

        let popoverTemplate = game.JTCS.templates["popover"];
        popoverElement = parentElement.find(`.popover[data-popover-id="${templateData.dataset.popoverId}"]`);
        if (!popoverElement.length) {
            //if it doesn't already exist, create it
            let renderedHTML = await renderTemplate(popoverTemplate, templateData);
            parentElement.append(renderedHTML);
            popoverElement = parentElement.find(".popover");
        }

        let popoverData = elementDataArray.find((data) => data.name === "popoverElement");

        popoverData.target = popoverElement;

        popoverElement.css({ position: "absolute" });
        popoverElement.offset({ top: boundingRect.top + boundingRect.height, left: boundingRect.left });
        popoverElement.focus({ focusVisible: true });

        //set up a "Click Out" event handler
        $(document)
            .off("click")
            .on("click", async (event) => {
                if (Popover.isOutsideClick(event)) {
                    await Popover.hideAndDeletePopover(popoverElement);
                }
            });

        //hideEvents should be list of events to hide the popover on (like blur, change, mouseout, etc)
        elementDataArray.forEach((data) => {
            let targetElement = data.target;

            data.hideEvents.forEach((eventData) => {
                let handler;
                let selector;
                let eventName;
                let options;

                if (typeof eventData === "string") {
                    //if it's a simple string, just set the handler to immediaetly hide the popover on this event
                    eventName = eventData;
                    handler = async (event) => await Popover.hideAndDeletePopover(popoverElement);
                    selector = "*";
                } else if (typeof eventData === "object") {
                    //if it's an object, we'll want to do something (like validate input) first before hiding
                    eventName = eventData.eventName;

                    //pass the popover element and the hide function to the wrapperFunction
                    options = {
                        ...eventData.options,
                        popover: popoverElement,
                        hideFunction: Popover.hideAndDeletePopover,
                    };
                    handler = async (event, options) => {
                        await eventData.wrapperFunction(event, options);
                    };
                    selector = eventData.selector;
                }
                $(targetElement)
                    .off(eventName)
                    .on(eventName, selector, async (event) => await handler(event, options));
            });
        });

        return popoverElement;
    }

    static isOutsideClick(event) {
        if ($(event.target).closest(".popover").length) {
            //click was on the popover
            return false;
        }
        //if our click is outside of our popover element
        return true;
    }

    static isMouseOver() {}

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
