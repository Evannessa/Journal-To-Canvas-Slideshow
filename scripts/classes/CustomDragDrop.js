class DisplayJournalSheet extends JournalSheet {
    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            template: "`modules/journal-to-canvas-slideshow/templates/display-journal.hbs",
            dragDrop: [
                {
                    dragstart: this._onDragStart.bind(this),
                    dragover: this._onDragOver.bind(this),
                    drop: this._onDrop.bind(this),
                },
            ],
        });
    }

    _onDrop() {
        console.log("Something Dropped");
    }

    /** @override */
    getData() {
        const context = super.getData();
        return context;
    }

    /** @override */
    get template() {
        return `modules/journal-to-canvas-slideshow/templates/display-journal.hbs`;
    }
    activateListeners(html) {
        super.activateListeners(html);
        let handler = (ev) => this._onDragStart(ev);
        // Find all items on the character sheet.
        html.find("li.item").each((i, li) => {
            // Ignore for the header row.
            if (li.classList.contains("item-header")) return;
            // Add draggable attribute and dragstart listener.
            li.setAttribute("draggable", true);
            li.addEventListener("dragstart", handler, false);
        });
    }
}
