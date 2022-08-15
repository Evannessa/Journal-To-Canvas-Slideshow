"use strict";
import { log, MODULE_ID } from "./debug-mode.js";

export class SlideshowConfig extends FormApplication {
    constructor(data) {
        super();
        this.data = data;
    }
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["form"],
            popOut: true,
            resizable: true,
            template: "modules/journal-to-canvas-slideshow/templates/scene-tiles-config.hbs",
            id: "slideshow-config",
            title: "Slideshow Config",
        });
    }

    async _handleHover(event) {
        let isLeave = event.type === "mouseleave" ? true : false;
        // we want every hover over a tile to highlight the tiles it is linked to
        let hoveredElement = $(event.currentTarget);
        let type = hoveredElement.data().type;
        let id = hoveredElement.data().id;
        let frameId = hoveredElement.data().frameId;

        let otherListItems = Array.from(hoveredElement[0].closest(".tilesInScene").querySelectorAll("li")).filter(
            //get list items with the opposite tile type
            (item) => {
                let passed = true;
                if (item.dataset.type === type) {
                    passed = false;
                }
                if (item.dataset.flag === "ignoreHover") {
                    passed = false;
                }
                return passed;
            }
        );

        otherListItems = otherListItems.filter((element) => {
            let dataset = Object.values({ ...element.dataset }).join(" ");
            let match = false;
            if (type === "art") {
                //for art tiles, we're looking for frameTiles in the list that match the frame id
                match = dataset.includes(frameId);
            } else if (type === "frame") {
                //for frame tiles, we're looking for art tiles in the list that have our id
                match = dataset.includes(id);
            }
            return match;
        });

        let tile = await game.JTCS.tileUtils.getTileByID(id);
        if (isLeave) {
            hoveredElement.removeClass("accent");
            $(otherListItems).removeClass("accent");
            game.JTCS.indicatorUtils.hideTileIndicator(tile);
        } else {
            hoveredElement.addClass("accent");
            $(otherListItems).addClass("accent");
            game.JTCS.indicatorUtils.showTileIndicator(tile);
        }
    }

    async setTileLinks(artTileDataArray, frameTileDataArray) {
        //get ids
        artTileDataArray.forEach((artTileData) => {
            //if we have a linked bounding tile
            let linkedFrameID = artTileData.linkedBoundingTile;
            frameTileDataArray.forEach((frameTileData) => {
                if (frameTileData.id === linkedFrameID) {
                }
            });
        });
    }
    async showURLImage() {
        new Dialog({
            title: "Set url image",
            content: `
		  <form>
			<div class="form-group">
			  <label>Set url image</label>
			  <input type='text' name='inputField'></input>
			</div>
		  </form>`,
            buttons: {
                yes: {
                    icon: "<i class='fas fa-check'></i>",
                    label: `Show Image to Players`,
                },
            },
            default: "yes",
            close: (html) => {
                let result = html.find("input[name='inputField']");
                if (result.val() !== "") {
                    game.JTCS.dis;
                    determineLocation(null, result.val());
                }
            },
        }).render(true);
    }

    async getData() {
        //return data to template
        let ourScene = game.scenes.viewed;
        let shouldPromptConversion = false;

        let artTileDataArray = await game.JTCS.tileUtils.getSceneSlideshowTiles("art", true);
        let frameTileDataArray = await game.JTCS.tileUtils.getSceneSlideshowTiles("frame", true);

        let unlinkedTileIDs = await game.JTCS.tileUtils.getUnlinkedTileIDs([
            ...artTileDataArray,
            ...frameTileDataArray,
        ]);

        let allJournals = game.journal.contents;
        let artJournal = await game.JTCS.utils.getSettingValue(
            "artGallerySettings",
            "dedicatedDisplayData.journal.value"
        );

        let artJournalData = {
            options: allJournals,
            value: artJournal,
        };

        let allScenes = await game.JTCS.tileUtils.getAllScenesWithSlideshowData();
        let artScene = await game.JTCS.utils.getSettingValue("artGallerySettings", "dedicatedDisplayData.scene.value");
        // let artScene = await game.JTCS.utils.getSettingValue("artScene");

        let artSceneData = {
            options: allScenes,
            value: artScene,
        };

        return {
            shouldActivateDisplayScene: this.shouldActivateDisplayScene,
            artTiles: artTileDataArray,
            frameTiles: frameTileDataArray,
            unlinkedTiles: unlinkedTileIDs,
            currentSceneName: game.scenes.viewed.name,
            artSceneData: artSceneData,
            allJournals: artJournalData,
        };
    }

    /**
     * Returns the data-id attribute's value from the parent LI if a child is clicked, or grabs it from the li itself if the li is clicked
     * @param {Element} clickedElement - the element that was clicked
     * @returns the ID from the "data-id" attribute stored on parent li
     */
    getIDFromListItem(clickedElement, childElementTypes = []) {
        let elementType = clickedElement.prop("tagName");
        //if the element's type is included in the array of types to look for
        let tileID = childElementTypes.includes(elementType)
            ? clickedElement[0].closest("li").dataset.id
            : clickedElement[0].dataset.id;
        return tileID;
    }

    async _handleButtonClick(event) {
        let clickedElement = $(event.currentTarget);
        console.log("Clicked element", clickedElement);
        event.stopPropagation();
        event.preventDefault();
        let action = clickedElement.data().action;
        let type = clickedElement.data().type;
        let name = clickedElement.data().displayName;

        //if we're clicking on a button within the list item, get the parent list item's id, else, get the list item's id
        let tileID = this.getIDFromListItem(clickedElement, ["BUTTON"]);

        // let tileID = elementType === "BUTTON" ? clickedElement[0].parentNode.dataset.id : clickedElement[0].dataset.id;

        switch (action) {
            case "convert":
                convertToNewSystem();
                break;
            case "createSlideshowTile":
                if (type === "frame") {
                    //TODO: Link it to this data specifically
                    await await game.JTCS.tileUtils.createFrameTile(tileID);
                } else {
                    await game.JTCS.tileUtils.createDisplayTile("", tileID);
                }
                this.render(true);
                break;
            case "renderTileConfig":
                await game.JTCS.tileUtils.renderTileConfig(tileID);
                break;
            case "selectTile":
                await game.JTCS.tileUtils.selectTile(tileID);
                break;
            case "deleteTileData":
                await game.JTCS.tileUtils.deleteSceneTileData(tileID);
                this.render(true);
                break;
            case "add":
                //we can create a new tile, or connect it to a tile that already exists
                // await game.JTCS.tileUtils.deleteSceneTileData(tileID);
                // this.render(true);
                break;
        }
    }

    /**
     * display a mini form in place of the add button
     */
    async displayMiniConfigForm() {}

    activateListeners(html) {
        super.activateListeners(html);
        let details = html.find("details");

        // html.on("keyup", "input[type='text']", async (event) => {
        //     console.log("Key press", event);
        //     let value = event.currentTarget.value;
        //     // if (event.code === "Enter" && value) {
        //     //     await game.JTCS.tileUtils.updateSceneTileFlags({
        //     //         id: `unlinked${foundry.utils.randomID()}`,
        //     //         displayName: value,
        //     //     });
        //     //     console.log(value);
        //     // }
        // });

        details.each((index, element) => {
            element.addEventListener("toggle", (event) => {
                if ($(element).attr("open")) {
                    $(element).find(".toggle-icon i").removeClass("fa-plus-square").addClass("fa-minus-square");
                } else {
                    $(element).find(".toggle-icon i").removeClass("fa-minus-square").addClass("fa-plus-square");
                }
            });
        });

        html.off("click").on("click", "[data-action]", this._handleButtonClick.bind(this));
        html.on(
            "mouseenter mouseleave",
            `li:not([data-missing='true'], [data-flag='ignore-hover'])`,
            this._handleHover.bind(this)
        );
        this.handleChange();
    }
    async handleChange() {
        async function handleTileItem(event, action) {
            console.error("Tile item handled");
            let { value, name, checked, type } = event.currentTarget;
            let clickedElement = $(event.currentTarget);

            if (value === "") {
                //don't submit the input if there's no value
                //TODO: Put an error message here
                return;
            }
            let tileType = clickedElement[0].closest("li").dataset.type;
            let isNewTile = false;

            let tileID;
            let isBoundingTile = tileType === "frame" ? true : false;
            if (name === "newTileName") {
                isNewTile = true;
                tileID = `unlinked${foundry.utils.randomID()}`;
                name = "displayName";
            } else {
                // if we're already a Slideshow tile, use this data
                tileID = game.JTCSlideshowConfig.getIDFromListItem(clickedElement, ["INPUT", "SELECT"]);
            }
            console.log(tileID, name, "creatingNewTile");

            if (tileID) {
                let updateData = {
                    id: tileID,
                    [name]: value,
                    ...(isNewTile ? { isBoundingTile: isBoundingTile } : {}),
                };
                await game.JTCS.tileUtils.updateSceneTileFlags(updateData, tileID);
                game.JTCSlideshowConfig.render(true);
            } else {
                //tile is unlinked
                // await game.JTCS.getTile;
            }
        }
        $("select, input[type='checkbox'], input[type='radio'], input[type='text']").on(
            "change",
            async function (event) {
                let clickedElement = $(event.currentTarget);
                // let hoverAction = clickedElement.data().hoverAction;
                let action = clickedElement.data().action;
                let value = clickedElement.val();

                switch (action) {
                    case "setArtScene":
                        await game.JTCS.utils.setSettingValue(
                            "artGallerySettings",
                            value,
                            "dedicatedDisplayData.scene.value"
                        );
                        game.JTCSlideshowConfig.render(true);
                        break;
                    case "setArtJournal":
                        await game.JTCS.utils.setSettingValue(
                            "artGallerySettings",
                            value,
                            "dedicatedDisplayData.journal.value"
                        );
                        // await game.JTCS.utils.setSettingValue("artJournal", value);
                        game.JTCSlideshowConfig.render(true);
                        break;
                    case "setFrameTile":
                    case "setLinkedTileObject":
                    case "createNewTileData":
                        handleTileItem(event, action);
                        break;
                }
            }
        );
    }

    async _updateObject(event, formData) {}
}

window.SlideshowConfig = SlideshowConfig;
