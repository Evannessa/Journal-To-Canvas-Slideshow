export const registerHelpers = function () {
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

    Handlebars.registerHelper("wrapInSpan", function (stringToWrap, classList = "accent") {
        let wrappedString = `<span class=${classList}>${stringToWrap}</span>`;
        return new Handlebars.SafeString(wrappedString);
    });

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
