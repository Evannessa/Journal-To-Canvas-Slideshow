"use strict";
import { log, MODULE_ID } from "./debug-mode.js";

export class SlideshowConfig extends Application {
    constructor(data = {}) {
        // super({ renderData: { ...data } });
        super(data);
        this.data = data;
        console.error("Rendering with data", this.data, data);
    }
    // 	async setupActionObjects(){
    // 		this.data.actions = {
    // 	click: [
    // 		game.JTCS.utils.createEventActionObject("createSlideshowTile", async (data)=> {
    // 			let {type} = data;
    //   			if (type === "frame") {
    //                     await game.JTCS.tileUtils.createFrameTile(tileID);
    //                 } else {
    //                     await game.JTCS.tileUtils.createDisplayTile("", tileID);
    //                 }
    // 		}, true),
    // 		game.JTCS.utils.createEventActionObject("linkTile", async (data)=> {
    // 				let {tileID} = data;
    //                 await this.createTileLinkDialogue(tileID);
    // 		}, false),
    // 		game.JTCS.utils.createEventActionObject("renderTileConfig", (data)=> {

    // 				let {tileID} = data;
    // 			await this.renderTileConfig(tileID);
    // 		}, false),
    // 		game.JTCS.utils.createEventActionObject("selectTile", (data)=> {
    // 				let {tileID} = data;
    //                 await game.JTCS.tileUtils.selectTile(tileID);
    // 		}, false),
    // 		game.JTCS.utils.createEventActionObject("deleteTileData", (data)=> {
    // 				let {tileID} = data;
    // 				await game.JTCS.tileUtils.deleteSceneTileData(tileID);
    // 		}, true)
    // 	],
    // 	onHover: [],
    // 	onChange: [],
    // 	onToggle: []
    // }
    // }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["form"],
            popOut: true,
            resizable: true,
            template: "modules/journal-to-canvas-slideshow/templates/scene-tiles-config.hbs",
            id: "slideshow-config",
            title: "Slideshow Config",
            scrollY: ["details > ul"],
        });
    }

    //for saving tab layouts and such
    renderWithData() {
        console.log(this.data);
        this.render(true, this.data);
        // this.render(true, { renderData: this.data });
    }

    async createTileLinkDialogue(tileID) {
        //create a dialog to link to the tile, and use this as a callback
        let onSubmitCallback = async (html) => {
            let selectedID = html[0].querySelector("select").value;
            await game.JTCS.tileUtils.updateTileDataID(tileID, selectedID);
            if (game.JTCSlideshowConfig?.rendered) {
                await game.JTCSlideshowConfig.renderWithData();
            }
        };
        let buttons = {
            submit: {
                label: "Link Tile",
                icon: '<i class="fas fa-plus"></i>',
                callback: onSubmitCallback,
            },
            cancel: {
                label: "Cancel",
            },
        };
        let linkedTiles = await game.JTCS.tileUtils.getSceneSlideshowTiles("", true);
        let unlinkedTilesIDs = await game.JTCS.tileUtils.getUnlinkedTileIDs(linkedTiles);
        let templatePath = game.JTCS.utils.createTemplatePathString("tile-link-partial.hbs");
        await game.JTCS.utils.createDialog("Tile Link Config", templatePath, {
            buttons: buttons,
            unlinkedTilesIDs: unlinkedTilesIDs,
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

    async setToggleButtonState(buttonElement, isActive = true) {
        buttonElement.classList.toggle("active");
    }

    async handleToggle(html) {
        let details = html.find("details");
        let toggleClassListener = (event, element) => {
            if ($(element).attr("open")) {
                $(element).find(".toggle-icon i").removeClass("fa-plus-square").addClass("fa-minus-square");
            } else {
                $(element).find(".toggle-icon i").removeClass("fa-minus-square").addClass("fa-plus-square");
            }
        };
        let saveOpenState = (event) => {
            let element = event.currentTarget;
            console.log(element);
            console.log(element.open);
            let isOpen = element.open;
            let elementData = game.JTCSlideshowConfig.data[element.id];
            if (isOpen === undefined || isOpen === null) {
                return;
            }
            if (elementData) {
                elementData = { ...elementData, isOpen: isOpen };
            } else {
                game.JTCSlideshowConfig.data[element.id] = { isOpen: isOpen };
            }
        };

        details.each((index, element) => {
            element.addEventListener("toggle", (event) => {
                toggleClassListener(event, element);
            });
            if (element.classList.contains("collapsible-wrapper")) {
                element.addEventListener("toggle", (event) => {
                    saveOpenState(event, element);
                });
            }
        });
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
            ...this.data,
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
        event.stopPropagation();
        event.preventDefault();
        let action = clickedElement.data().action;
        let type = clickedElement.data().type;
        let name = clickedElement.data().displayName;

        //if we're clicking on a button within the list item, get the parent list item's id, else, get the list item's id
        let tileID = this.getIDFromListItem(clickedElement, ["BUTTON"]);

        // let data = { clickedElement: clickedElement, action: action, type: type, name: name, tileID: tileID };

        // for (let actionObj of actions.click) {
        //     if (actionObj.name === action) {
        //         await actionObj.callback();
        //     }
        // }
        // if (actionObj.shouldRenderAppOnAction) {
        //     await this.renderWithData();
        // }

        switch (action) {
            case "convert":
                this.convertToNewSystem();
                break;
            case "createSlideshowTile":
                if (type === "frame") {
                    await game.JTCS.tileUtils.createFrameTile(tileID);
                } else {
                    await game.JTCS.tileUtils.createDisplayTile("", tileID);
                }
                await this.renderWithData();
                // this.render(true, { renderData: this.data });
                break;
            case "linkTile":
                //link this data to an unlinked tile in the scene
                await this.createTileLinkDialogue(tileID);
                break;
            case "renderTileConfig":
                await game.JTCS.tileUtils.renderTileConfig(tileID);
                break;
            case "selectTile":
                await game.JTCS.tileUtils.selectTile(tileID);
                break;
            case "deleteTileData":
                await game.JTCS.tileUtils.deleteSceneTileData(tileID);
                await this.renderWithData();
                // this.render(true, { renderData: this.data });
                break;
        }
    }

    async activateListeners(html) {
        super.activateListeners(html);
        // this.setupActionObjects();
        this.handleToggle(html);

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
                await game.JTCSlideshowConfig.renderWithData();
                // game.JTCSlideshowConfig.render(true, { renderData: this.data });
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
                        await game.JTCSlideshowConfig.renderWithData();
                        break;
                    case "setArtJournal":
                        await game.JTCS.utils.setSettingValue(
                            "artGallerySettings",
                            value,
                            "dedicatedDisplayData.journal.value"
                        );
                        // await game.JTCS.utils.setSettingValue("artJournal", value);
                        await game.JTCSlideshowConfig.renderWithData();
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
}

window.SlideshowConfig = SlideshowConfig;
