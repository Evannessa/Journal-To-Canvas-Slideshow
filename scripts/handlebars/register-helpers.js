export const registerHelpers = function () {
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

    Handlebars.registerHelper("dynamicPartial", function (key, partials) {
        let partialPath = partials[key];
        return new Handlebars.SafeString(partialPath);
    });
};
