export const universalInterfaceActions = {
    revealAnotherElement: (event, options) => {
        let { html, parentItem } = options;
        let el = event.currentTarget;
        let targetID = el.dataset.targetId;
        let target = parentItem.querySelector(`#${targetID}`);
        target?.classList.toggle("hidden");
    },
    toggleActiveStyles: (event) => {
        let el = event.currentTarget;
        el.classList.toggle("active");
    },
};
