export const registerHelpers = function () {
    Handlebars.registerHelper("applyTemplate", function (subTemplateId, context) {
        var subTemplate = Handlebars.compile($("#" + subTemplateId).html());
        var innerContent = context.fn({});
        var subTemplateArgs = _.extend({}, context.hash, { content: new Handlebars.SafeString(innerContent) });

        return subTemplate(subTemplateArgs);
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

    Handlebars.registerHelper("wrapInSpan", function (stringToWrap, classList = "accent") {
        let wrappedString = `<span class=${classList}>${stringToWrap}</span>`;
        return new Handlebars.SafeString(wrappedString);
    });

    Handlebars.registerHelper("wrapInElement", function (stringToWrap, tagName, classList = "") {
        let wrappedString = `<${tagName} class=${classList}>${stringToWrap}</${tagName}>`;
        return new Handlebars.SafeString(wrappedString);
    });

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
