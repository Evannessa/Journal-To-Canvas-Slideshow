import { HelperFunctions } from "../classes/HelperFunctions.js";
export const registerHelpers = function () {
    Handlebars.registerHelper("flattenObject", (object) => {
        return flattenObject(object);
    });

    /**
     * Returns a property string that matches a dot-notation-chain for nested objects
     */
    Handlebars.registerHelper("getPropertyString", (rootObject, parentKey, childKey) => {
        const parentObject = getProperty(rootObject, parentKey);
        const flat = flattenObject(parentObject);
        const newFlat = Object.keys(flat).map((key) => `${parentKey}.${key}`);
        return newFlat.find((key) => key.includes(childKey));
    });

    Handlebars.registerHelper("applyTemplate", function (subTemplateId, context) {
        var subTemplate = Handlebars.compile($("#" + subTemplateId).html());
        var innerContent = context.fn({});
        var subTemplateArgs = _.extend({}, context.hash, {
            content: new Handlebars.SafeString(innerContent),
        });

        return subTemplate(subTemplateArgs);
    });
    Handlebars.registerHelper(
        "checkAll",
        function (anyOrAll = "all", valueToEqual = true, ...conditions) {
            conditions.pop();
            //if the property has every object, and every object is true

            if (anyOrAll === "all") {
                return conditions.every((condition) => {
                    return condition === valueToEqual;
                });
            } else {
                return conditions.some((condition) => {
                    return condition === valueToEqual;
                });
            }
        }
    );
    Handlebars.registerHelper("filter", function (object, conditionName, conditionValue) {
        let array = Object.entries(object).filter(
            ([key, data]) => data[conditionName] === conditionValue || data.renderAlways
        );
        return Object.fromEntries(array);
    });
    Handlebars.registerHelper("camelCaseToDashCase", function (string) {
        let dashedString = string.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
        return dashedString;
    });
    Handlebars.registerHelper("safeString", function (string) {
        return Handlebars.SafeString(string);
    });
    Handlebars.registerHelper("camelCaseToCapitalString", function (string) {
        return HelperFunctions.capitalizeEachWord(string, "");
        // let sentence = string.split(/(?=[A-Z])/).map((s) => s.toLowerCase());
        // sentence = sentence.map((s) => s.charAt(0).toUpperCase() + s.slice(1));
        // sentence = sentence.join(" ");
        // return sentence;
    });

    Handlebars.registerHelper("camelCaseToArray", function (string, shouldJoin = false) {
        let sentence = string.split(/(?=[A-Z])/).map((s) => s.toLowerCase());
        if (shouldJoin) {
            sentence = sentence.join(" ");
        }
        return sentence;
    });

    Handlebars.registerHelper("combineToString", function (...args) {
        args.pop();
        let sentence = args.join(" ");
        return new Handlebars.SafeString(sentence);
    });

    Handlebars.registerHelper(
        "wrapInSpan",
        function (stringToWrap, classList = "accent") {
            let wrappedString = `<span class=${classList}>${stringToWrap}</span>`;
            return new Handlebars.SafeString(wrappedString);
        }
    );

    Handlebars.registerHelper(
        "wrapInElement",
        function (stringToWrap, tagName, classList = "") {
            let wrappedString = `<${tagName} class=${classList}>${stringToWrap}</${tagName}>`;
            return new Handlebars.SafeString(wrappedString);
        }
    );

    Handlebars.registerHelper("generateChildPartials", function (object) {});

    Handlebars.registerHelper("ternary", function (test, yes, no) {
        return test ? yes : no;
    });

    Handlebars.registerHelper("dynamicPartial", function (key, partials = "") {
        if (!partials || !Array.isArray(partials)) {
            partials = game.JTCS.templates;
        }
        let partialPath = partials[key];
        return new Handlebars.SafeString(partialPath);
    });

    Handlebars.registerHelper("withTooltip", function () {
        let wrappedString = `<span class=${classList}>${stringToWrap}</span>`;
    });
};
