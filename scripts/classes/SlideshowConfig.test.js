import { SlideshowConfig } from "../SlideshowConfig.js";
import { HelperFunctions } from "./HelperFunctions.js";
import { ArtTileManager } from "./ArtTileManager.js";
import { ImageDisplayManager } from "./ImageDisplayManager.js";
import { JTCSSettingsApplication } from "./JTCSSettingsApplication.js";
import { TestUtils } from "../tests/test-utils.js";

const slideshowConfigTest = async (context) => {};

Hooks.on("quenchReady", async (quench) => {
    quench.registerBatch(
        "Slideshow Config Test",
        async (context) => {
            const { describe, it, assert, expect, should } = context;
            const {
                dispatchChange,
                dispatchMouseDown,
                getTileObject,
                getDocData,
                resizeTile,
                changeTileImage,
                getArtGallerySettings,
                getDocIdFromApp,
                getAppFromWindow,
                getAreasOfDocs,
                deleteTestScene,
                duplicateTestScene,
                initializeScene,
                returnClassListAsArray,
                returnComputedStyles,
                checkAppElementForId,
            } = TestUtils;
            describe("Slideshow Config Test Suite", async function () {
                let configApp, configElement, scene, defaultImageSrc;

                async function clickGlobalButton(actionName) {
                    configElement[0]
                        .querySelector(
                            `[data-action='globalActions.click.actions.${actionName}']`
                        )
                        .click();
                    await quench.utils.pause(900);
                }

                /**
                 * @description - renders the Scene Config
                 */
                async function renderConfig() {
                    configApp = new SlideshowConfig();
                    await configApp._render(true);
                    configElement = configApp.element;
                }
                async function getTestData() {
                    defaultImageSrc = await getArtGallerySettings(
                        "defaultTileImages.paths.artTilePath"
                    );
                }
                before(async () => {
                    let sourceScene = await initializeScene();
                    scene = await duplicateTestScene(sourceScene);
                    await getTestData();
                    await renderConfig();
                });
                after(async () => {
                    await deleteTestScene(scene);
                });
                describe("Testing Linked Gallery Tile Item Actions in overflow menu", async function () {
                    let tileID,
                        tileData,
                        tileDoc,
                        tileItemPrefixString,
                        ourTileElement,
                        tileElements,
                        overflowMenu,
                        ourButton;

                    before(async () => {
                        await getTileData();
                    });
                    beforeEach(async () => {
                        await doBeforeEach();
                    });
                    let doBeforeEach = async () => {
                        await toggleOverflowMenu();
                        await changeTileImage(tileID, defaultImageSrc);
                        await getTileData();
                    };

                    async function getTileData() {
                        tileID = await ArtTileManager.getDefaultArtTileID(scene);
                        tileData = await ArtTileManager.getGalleryTileDataFromID(tileID);
                        tileDoc = await getTileObject(tileID);
                        tileItemPrefixString = "[data-action='itemActions.click.actions.";
                        tileElements = $(configElement).find(
                            `.tile-list-item:not([data-is-default])`
                        );
                        ourTileElement = $(configElement).find(
                            `.tile-list-item[data-is-default]`
                        )[0];
                    }

                    // get tile Item id
                    async function clickActionButton(actionName, element = overflowMenu) {
                        console.log(
                            "%cSlideshowConfig.test.js line:102 overflowMenu",
                            "color: #26bfa5;",
                            overflowMenu
                        );
                        const actionQueryString = combine(actionName);
                        await clickButton(element, actionQueryString);
                        // ourButton = element.querySelector(actionQueryString);
                        // ourButton.click();
                        // await quench.utils.pause(900);
                    }
                    async function clickButton(element, selector) {
                        ourButton = element.querySelector(selector);
                        ourButton.click();
                        await quench.utils.pause(500);
                    }

                    // async function getFameTileData() {
                    //     let frameTileID = tileData.linkedBoundingTile;
                    //     let frameTileData = await ArtTileManager.getGalleryTileDataFromID(
                    //         frameTileID
                    //     );
                    //     return frameTileData;
                    // }

                    function combine(actionName) {
                        let string = `${tileItemPrefixString}${actionName}']`;
                        return string;
                    }
                    async function toggleOverflowMenu() {
                        await clickActionButton("toggleOverflowMenu", ourTileElement);
                        //get the popover, which will be a child of the parent app's element
                        overflowMenu = configElement[0].querySelector(".popover");
                        return overflowMenu;
                    }
                    it("renders the overflow menu when the 'toggle overflow menu'", async function () {
                        assert.notEqual(
                            ourTileElement,
                            undefined,
                            "Our tile element should be defined"
                        );

                        assert.notEqual(
                            overflowMenu,
                            undefined,
                            "Our overflow menu element should be defined"
                        );
                    });

                    it("selects the tile when the 'Select Tile' action is clicked", async function () {
                        await clickActionButton("selectTile");

                        const layerName = game.version >= 10 ? "tiles" : "background";
                        const selectedTileID = canvas[layerName].controlled[0].id;
                        expect(selectedTileID).to.equal(tileID);
                    });

                    it("renders the Tile's configuration app when the 'render tile config' action is clicked", async () => {
                        await clickActionButton("renderTileConfig");
                        const app = getAppFromWindow(TileConfig);
                        let id = getDocIdFromApp(app);
                        expect(id).to.equal(tileID);
                        await app.close();
                    });

                    it("Updates the tile's dimensions to be within that of its frame tile's dimensions when the 'Fit Tile to Frame' button is clicked", async () => {
                        //resize the tile to be bigger than scene
                        await resizeTile(tileDoc, scene);

                        //get the frame data, whether frame tile or scene
                        let { linkedBoundingTile } = tileData;
                        let frameDoc;
                        if (linkedBoundingTile) {
                            frameDoc = await getTileObject(linkedBoundingTile);
                        } else {
                            frameDoc = game.scenes.viewed;
                        }
                        //get the area of the frame, and that of the art tile while resized (which should be bigger)
                        const { frameArea, artArea: oldArtArea } = await getAreasOfDocs(
                            frameDoc,
                            tileDoc
                        );
                        expect(oldArtArea).to.be.above(frameArea);
                        // press the Fit Tile to Frame Button
                        await clickActionButton("fitTileToFrame");
                        // get the new area of the art tile
                        const { artArea: newArtArea } = await getAreasOfDocs(
                            frameDoc,
                            tileDoc
                        );

                        //ensure the art tile area is smaller than the frame's area now
                        expect(newArtArea).to.be.below(frameArea);
                    });
                    it("resets the Tile Image back to default when Clear Tile Image button is clicked", async () => {
                        assert.isDefined(
                            defaultImageSrc,
                            "default image source is defined"
                        );
                        //change the current tile's image (without url, will default to another image)
                        await changeTileImage(tileID);

                        // get tile's current image
                        const oldImgSrc = await getDocData(tileDoc, "texture.src");

                        assert.isDefined(oldImgSrc, "Image source is defined");
                        //check to see if it changed
                        expect(
                            oldImgSrc,
                            "Tile's old texture src should NOT equal default image path"
                        ).to.not.equal(defaultImageSrc);

                        // * & click Clear Tile Image Button
                        await clickActionButton("clearTileImage");

                        const newImgSrc = await getDocData(tileDoc, "texture.src");
                        // - test Tile Image now matches 'default' image saved
                        expect(
                            newImgSrc,
                            "Tile's texture src should equal default image path"
                        ).to.equal(defaultImageSrc);
                    });

                    /**
                     * simulates clicking the "deleteTileData" action button on a tile item
                     * @returns returns the dialog rendered after the click
                     */
                    async function clickDeleteTileDataButton() {
                        //click  "Delete Gallery Tile Data" Button and wait for prompt

                        await clickActionButton("deleteTileData", overflowMenu);
                        // - ~ Prompt is created, asking if user wants to delete data
                        let app = getAppFromWindow(Dialog);
                        let dialogElement = app.element;
                        //get the dialog element from ui.windows
                        return { app, dialogElement };
                    }

                    it("renders a Delete Data confirmation prompt", async () => {
                        //click  "Delete Gallery Tile Data" Button
                        let { dialogElement, app } = await clickDeleteTileDataButton();
                        assert.isDefined(dialogElement, "Delete dialog is defined");
                        expect(app.element.text()).to.include("Delete");
                        await app.close();
                    });
                    it("deletes the tile data on 'Delete'", async () => {
                        // ! - & On approve, dialog closes, tile data is deleted
                        let { dialogElement } = await clickDeleteTileDataButton();
                        await clickButton(dialogElement[0], ".dialog-button.delete");
                        // - ~ Scene Config App updates
                        let sceneTiles = await ArtTileManager.getSceneSlideshowTiles(
                            "art",
                            true
                        );
                        let ourTile = sceneTiles.find((tile) => (tile.id = tileID));
                        console.log(sceneTiles, ourTile);

                        //since deleting, re-get the tile data
                        await getTileData();
                        assert.fail();
                        // - ~ IF FRAME, linked Art Tiles default to "Canvas as Frame"

                        //toggle the overflow menu again?
                        // ourTileElement = await toggleOverflowMenu();
                    });

                    it("closes the dialog button on cancel", async () => {
                        // ? - & On cancel, dialog closes, nothing happens
                        let { dialogElement } = await clickDeleteTileDataButton();
                        await clickButton(dialogElement[0], ".dialog-button.cancel");
                        //app should be undefined now after cancel is clicked
                        let app = getAppFromWindow(Dialog, "Delete URL");
                        assert.isUndefined(app);
                    });
                    async function renderURLSharePopover() {
                        await clickActionButton("shareURLOnTile", ourTileElement);
                        let popoverId = "input-with-error";
                        let urlShareElement = configElement[0].querySelector(
                            `.popover[data-popover-id='${popoverId}']`
                        );
                        let inputBox = urlShareElement.querySelector("input");
                        return { urlShareElement, inputBox };
                    }
                    it("renders the SHARE URL IMAGE popover box", async () => {
                        doBeforeEach = async () => {
                            await getTileData();
                        };
                        // Click on "Share URL Image" button
                        let { urlShareElement, inputBox } = await renderURLSharePopover();
                        assert.exists(urlShareElement, "the popover should exist");
                        assert.exists(inputBox, "the input box should exist");
                    });
                    it("on change, notifies the user when an invalid url is provided", async () => {
                        // 	- & On Change
                        // 		- ~ Submits.
                        // 		- ! If not valid URL, notification appears warning user that is invalid
                        let { inputBox } = await renderURLSharePopover();
                        inputBox.value = "test";
                        dispatchChange(inputBox);
                        quench.utils.pause(100);
                        let notification = ui.notifications.active[0][0];
                        assert.exists(notification, "The notification exists");
                        let includesErrorClass = notification.classList.contains("error");
                        console.log(
                            notification,
                            notification.classList,
                            notification.classList.contains("error")
                        );
                        assert.isTrue(
                            includesErrorClass,
                            "This is an error notification"
                        );
                    });
                    it("on change, if url is valid and not CORS, sets the tile image to equal the url", async () => {
                        let { inputBox } = await renderURLSharePopover();
                        let oldImg = await getDocData(tileDoc, "texture.src");
                        console.log(oldImg);
                        //enter placeholder png
                        inputBox.value =
                            "https://images.pexels.com/photos/934067/pexels-photo-934067.jpeg";
                        dispatchChange(inputBox);
                        await quench.utils.pause(900);
                        await getTileData(); //reseting the tile data again

                        let newImg = await getDocData(tileDoc, "texture.src");
                        expect(
                            newImg,
                            "New Tile Image shouldn't Equal old img"
                        ).to.not.equal(oldImg);
                    });
                    it("sets the tile to be the default tile", async () => {
                        // 	Ctrl + Click (Set Default Action)
                        let otherTileElement = Array.from(tileElements).filter(
                            (tileEl) => tileEl.dataset.type === "art"
                        )[0];
                        assert.exists(
                            otherTileElement,
                            "A secondary tile element exists"
                        );
                        let oldDefaultID = tileID;

                        dispatchMouseDown(otherTileElement); //dispatching an event witfh ctrl pressed?
                        await quench.utils.pause(900);
                        // await getTileData();
                        // - ~ Tile is set as default tile in current scene
                        let newDefaultId = await ArtTileManager.getDefaultArtTileID(
                            scene
                        );
                        expect(newDefaultId).to.not.equal(oldDefaultID);
                        // - ~ Config app re-renders.
                        // 	- $ Tile Item now has color change to match.
                        // - $ Tile Indicator Color changes to match default color  as set in settings
                        // - ~ sheet images are sent to this tile when image clicked (maybe place under "Sheet") section
                    });
                    it("creates a new tile with the same id as the unlinked tile", () => {
                        assert.fail();
                    });
                });
                describe("Slideshow config global actions", async () => {
                    before(async () => {
                        await renderConfig();
                    });
                    it("renders the JTCS Art Gallery settings Application", async () => {
                        await clickGlobalButton("showModuleSettings");
                        let app = getAppFromWindow(JTCSSettingsApplication);
                        assert.exists(app, "The app has been rendered");
                        await app.close();
                    });
                    it("renders the URL Share Dialog", async () => {
                        await clickGlobalButton("showURLShareDialog");
                        let app = getAppFromWindow(Dialog);
                        assert.exists(app, "The app has been rendered");
                        expect(app.element.text()).to.include("Share URL");
                        await app.close();
                    });
                    it("fades out the Scene Gallery Config", async () => {
                        let classList;
                        let opacityValue;
                        const recheckClassList = () => {
                            let el = configElement;
                            let sel = ".window-content";
                            classList = returnClassListAsArray(el, sel);
                            opacityValue = parseFloat(
                                returnComputedStyles(el, sel, "opacity")
                            );
                            console.log(
                                "%cSlideshowConfig.test.js line:378 opacity",
                                "color: #26bfa5;",
                                opacityValue
                            );
                        };
                        //by default shouldn't include fade
                        recheckClassList();
                        expect(classList).to.not.include("fade");
                        expect(opacityValue).to.equal(1.0);

                        //should include fade after fade button is clicked
                        await clickGlobalButton("toggleSheetOpacity");
                        recheckClassList();
                        expect(classList).to.include("fade");
                        //check opacity
                        expect(opacityValue).to.equal(0.5);

                        //should not includ fade after fade button is clicked once more
                        await clickGlobalButton("toggleSheetOpacity");
                        recheckClassList();
                        expect(classList).to.not.include("fade");
                        expect(opacityValue).to.equal(1.0);
                    });
                });
            });
        },
        { displayName: "QUENCH: SlideshowConfig Test Suite" }
    );
});
