fetch("https://classy-bavarois-433634.netlify.app/anj%C3%A8l-alimoux")
    .then((response) => response.text())
    .then((data) => getFirstParagraph(data));

function getFirstParagraph(data) {
    let headingLevel = 2;
    let dummyElement = document.createElement("div");
    dummyElement.insertAdjacentHTML("beforeend", data);
    let mainArea = dummyElement.querySelector("main");
    let content = dummyElement.querySelector("content article content");
    let allChildren = Array.from(content.children);
    let headings = dummyElement.querySelectorAll(`content h${headingLevel}`);
    headings = Array.from(headings);
    let indexes = headings.map((heading) => {
        return allChildren.indexOf(heading);
    });
    let sections = [];
    let sectionHeaders = [];
    indexes.forEach((headingIndex, index) => {
        let start = headingIndex;
        let end = indexes[index + 1];
        if (end > allChildren.length) {
            end = allChildren.length - 1;
        }
        sectionHeaders.push(allChildren[start]);
        sections.push(allChildren.slice(start + 1, end));
    });
    // sections = sections.filter((el)=> el.tagName === "p" || el.tagName === `h3`)
    // let sectionsObject = Object.fromEntries(sections);
    let periods = sections.map((array) =>
        array
            .filter((el) => el.textContent && !(el.textContent.includes("#event") || el.textContent.includes("#scene")))
            .map((el) => {
                return el.outerHTML;
            })
    );
    let card = document.querySelector(".card");
    periods.map((array) => array.flat());
    periods.forEach((element) => {
        card.insertAdjacentHTML("beforeend", element);
    });
    let anchorTags = document.querySelectorAll("a");

    anchorTags = Array.from(anchorTags);

    anchorTags.forEach((a) => {
        if (a.classList.contains("internal-link")) {
            let oldHref = a.getAttribute("href");
            let newHref = `https://classy-bavarois-433634.netlify.app${oldHref}`;
            a.setAttribute("href", newHref);
        }
    });
}
