import { SlideshowConfig } from "../SlideshowConfig.js";
import { HelperFunctions } from "./HelperFunctions.js";
import { ArtTileManager } from "./ArtTileManager.js";
import { ImageDisplayManager } from "./ImageDisplayManager.js";
import { JTCSSettingsApplication } from "./JTCSSettingsApplication.js";
import { TestUtils } from "../tests/test-utils.js";
import { sheetImageDisplayTest } from "./SheetImage.test.js";

const slideshowConfigTest = async (context) => {
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
        getDefaultImageSrc,
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
                ourButton,
                originalTileID;

            before(async () => {
                await getTileData();
                originalTileID = tileID; //store the very first tile
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
                const actionQueryString = combine(actionName);

                await clickButton(element, actionQueryString);
            }
            async function clickButton(element, selector) {
                ourButton = element.querySelector(selector);
                ourButton.click();
                await quench.utils.pause(900);
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
            it("renders the overflow menu when the 'toggle overflow menu' button is pressed", async function () {
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
                const { artArea: newArtArea } = await getAreasOfDocs(frameDoc, tileDoc);

                //ensure the art tile area is smaller than the frame's area now
                expect(newArtArea).to.be.below(frameArea);
            });
            it("resets the Tile Image back to default when Clear Tile Image button is clicked", async () => {
                if (!defaultImageSrc) {
                    defaultImageSrc = await getDefaultImageSrc("art");
                }
                assert.isDefined(defaultImageSrc, "default image source is defined");
                //change the current tile's image (without url, will default to another image)
                await changeTileImage(tileID);

                // get tile's current image
                let textureProperty = game.version >= 10 ? "texture.src" : "img";
                const oldImgSrc = await getDocData(tileDoc, textureProperty);

                assert.isDefined(oldImgSrc, "Image source is defined");
                //check to see if it changed
                expect(
                    oldImgSrc,
                    "Tile's old texture src should NOT equal default image path"
                ).to.not.equal(defaultImageSrc);

                // * & click Clear Tile Image Button
                await clickActionButton("clearTileImage");
                const newImgSrc = await getDocData(tileDoc, textureProperty);
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
                let sceneTiles = await ArtTileManager.getSceneSlideshowTiles("art", true);
                let ourOriginalTile = sceneTiles.find((tile) => tile.id === tileID);
                expect(ourOriginalTile).to.not.exist;
                await getTileData();
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
                let { inputBox } = await renderURLSharePopover();
                inputBox.value = "test";
                dispatchChange(inputBox);
                quench.utils.pause(100);
                let notification = ui.notifications.active[0][0];
                assert.exists(notification, "The notification exists");
                let includesErrorClass = notification.classList.contains("error");

                assert.isTrue(includesErrorClass, "This is an error notification");
            });
            it("on change, if url is valid and not CORS, sets the tile image to equal the url", async () => {
                let { inputBox } = await renderURLSharePopover();
                let textureProperty = game.version >= 10 ? "texture.src" : "img";
                let oldImg = await getDocData(tileDoc, textureProperty);
                //enter placeholder png
                inputBox.value =
                    "https://images.pexels.com/photos/934067/pexels-photo-934067.jpeg";
                dispatchChange(inputBox);
                await quench.utils.pause(900);
                await getTileData(); //reseting the tile data again
                let newImg = await getDocData(tileDoc, textureProperty);
                expect(newImg, "New Tile Image shouldn't Equal old img").to.not.equal(
                    oldImg
                );
            });
            it("sets the tile to be the default tile", async () => {
                // 	Ctrl + Click (Set Default Action)
                let otherTileElement = Array.from(tileElements).filter(
                    (tileEl) => tileEl.dataset.type === "art"
                )[0];
                assert.exists(otherTileElement, "A secondary tile element exists");
                let oldDefaultID = tileID;

                dispatchMouseDown(otherTileElement); //dispatching an event witfh ctrl pressed?
                await quench.utils.pause(900);
                // - ~ Tile is set as default tile in current scene
                let newDefaultId = await ArtTileManager.getDefaultArtTileID(scene);
                expect(newDefaultId).to.not.equal(oldDefaultID);
                //TODO - test border colors and indicator colors
                // 	- $ Tile Item now has color change to match.
                // - $ Tile Indicator Color changes to match default color  as set in settings
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
                    opacityValue = parseFloat(returnComputedStyles(el, sel, "opacity"));
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
};
const unlinkedTilesTest = async (context) => {
    const { describe, it, assert, expect, should } = context;
    const {
        testFitToFrame,
        getDefaultImageSrc,
        renderConfig,
        dispatchEvent,
        getTileObject,
        getDocData,
        changeTileImage,
        getArtGallerySettings,
        deleteTestScene,
        duplicateTestScene,
        initializeScene,
        returnClassListAsArray,
        returnComputedStyles,
    } = TestUtils;
    const itemActionPrefixString = "[data-action='itemActions.click.actions.";
    let configApp, configElement, scene, defaultImageSrc, newArtTileBtn, newFrameTileBtn;
    async function bundleTestData() {
        let sourceScene = await initializeScene("Empty Tile Scene");
        scene = await duplicateTestScene(sourceScene);
        await quench.utils.pause(300);

        defaultImageSrc = await getDefaultImageSrc();
        ({ configApp, configElement } = await renderConfig());

        newArtTileBtn = configElement.find(
            ".wrapper.art-tiles .new-tile-list-item button"
        );
        newFrameTileBtn = configElement.find(
            ".wrapper.frame-tiles .new-tile-list-item button"
        );
    }
    //reset all of the references
    async function getConfigData() {
        configElement = $(document.documentElement.querySelector("#slideshow-config"));
        newArtTileBtn = configElement.find(
            ".wrapper.art-tiles .new-tile-list-item button"
        );
        newFrameTileBtn = configElement.find(
            ".wrapper.frame-tiles .new-tile-list-item button"
        );
    }
    describe("It tests the creation and linking of new tiles", async function () {
        before(async () => {
            await bundleTestData();
        });
        after(async () => {
            await deleteTestScene(scene);
        });
        // beforeEach(async ()=> {
        // 	await getConfigData()
        // })
        async function getTileListItem(type) {
            let tileListElement = configElement.find(
                `.tile-list-item[data-type='${type}']:not(.new-tile-list-item)`
            )[0];
            return tileListElement;
        }
        async function createNewTileListItem(type) {
            let btn = type === "art" ? newArtTileBtn : newFrameTileBtn;
            btn.click();
            await quench.utils.pause(900);
            await getConfigData();
            return await getTileListItem(type);
            let tileListElement = configElement.find(
                `.tile-list-item[data-type='${type}']:not(.new-tile-list-item)`
            )[0];
            return tileListElement;
        }
        function getInlineBadge(tileListElement) {
            let unlinkedNotificationBadge = tileListElement.querySelector(
                ".inline-notification[data-variant='warning']"
            );
            return unlinkedNotificationBadge;
        }
        async function checkInlineBadge(tileListElement, shouldExist = true) {
            let unlinkedNotificationBadge = getInlineBadge(tileListElement);
            if (shouldExist) {
                assert.exists(
                    unlinkedNotificationBadge,
                    "The unlinked notification badge should exist"
                );
            } else {
                expect(
                    unlinkedNotificationBadge,
                    "The unlinked notification badge should not exist"
                ).to.not.exist;
            }
        }
        async function clickUnlinkedActionButton(actionName, type) {
            const fullActionString = `${itemActionPrefixString}${actionName}']`;
            const tileListItem = await getTileListItem(type);
            const btn = tileListItem.querySelector(fullActionString);
            assert.exists(btn);
            btn.click();
            await quench.utils.pause(900);
            await getConfigData();
            // return await getConfigData();
        }

        async function createAndCheckNewLinkedTile(type) {
            let tiles;

            /**
             * Get the tiles in the scene
             */
            function getTiles() {
                tiles = scene.tiles.contents;
            }

            getTiles();
            let length = tiles.length;
            // expect(tiles, "Scene should have no tiles at first").to.be.empty;
            const actionName = "createNewGalleryTile";
            await clickUnlinkedActionButton(actionName, type);

            getTiles();
            expect(tiles).to.have.length.above(length);

            //STUB - get the tile list item element
            let tileListElement = await getTileListItem(type);
            let tileID = tileListElement.dataset.id;
            let tileDoc = await getTileObject(tileID);
            let textureProperty = game.version >= 10 ? "texture.src" : "img";
            let tileDocSrc = await getDocData(tileDoc, textureProperty);
            console.log(tileID, tileDoc, textureProperty, tileDocSrc)
            let tileDocID = tileDoc.id; //await getDocData(tileDoc, "id");

            //STUB - Test that the Tile ID doesn't contain "unlinked" anymore
            expect(
                tileID,
                "Tile id shouldn't have 'unlinked' anymore"
            ).to.not.contain.oneOf(["unlinked"]);

            //STUB - Test that the Tile has the Default Frame Tile Image as stored in the settings
            let defaultSrc = await getDefaultImageSrc(type);
            expect(
                tileDocSrc,
                "The tile should have the same image as the defalt frame tile image"
            ).to.equal(defaultSrc);

            // STUB - test that the Tile List Item no longer has the 'unlinked' badge
            await checkInlineBadge(tileListElement, false);

            //STUB - Test that the created tile's id and the current tile's id now match
            expect(tileID).to.equal(tileDocID);
        }

        function getSelectElementAndOptions(tileListItem) {
            let frameSelect = tileListItem.querySelector("select");
            let options = Array.from(frameSelect.querySelectorAll("option"));
            return {
                frameSelect,
                options,
            };
        }

        async function clickOptionElement(tileListItem) {
            let { frameSelect, options } = getSelectElementAndOptions(tileListItem);
            let frameOption1 = options[1];
            assert.exists(frameOption1);

            let optionValue = frameOption1.value;
            frameSelect.value = optionValue;
            await quench.utils.pause(400);
        }
        it("creates a new Scene Gallery Tile Element in the config, when 'new art tile button' is clicked", async function () {
            let tileListElement = await createNewTileListItem("art");
            assert.exists(
                tileListElement,
                "This new art Gallery Tile List Item element should exist"
            );
            await checkInlineBadge(tileListElement);

            // TODO - assert also that the art tile has the Canvas as its frame
        });
        it("Creates a new Frame Gallery Tile Element in the config, when the 'new Frame Tile Button' is clicked", async function () {
            let tileListElement = await createNewTileListItem("frame");
            assert.exists(
                tileListElement,
                "This new FRAME Gallery Tile List Item element should exist"
            );
            await checkInlineBadge(tileListElement);
        });

        it("Creates a new ART tile on the canvas when the 'Button' is pressed", async function () {
            await createAndCheckNewLinkedTile("art");
        });
        it("Creates a new FRAME tile on the canvas when the 'Button' is pressed", async function () {
            await createAndCheckNewLinkedTile("frame");
        });
        it("Checks to see if selecting an Art Tile for the Frame Tile updates the art tile in the config", async function () {
            // test that the selected Frame Tile updates in the config
            let frameSelect, options, selectedValue, tileListItem;
            async function getFrameAndTileListItem() {
                tileListItem = await getTileListItem("art");
            }
            async function getFrameSelectAndOptions() {
                tileListItem = await getTileListItem("art");
                frameSelect = getSelectElementAndOptions(tileListItem).frameSelect;
                options = getSelectElementAndOptions(tileListItem).options;
                assert.exists(frameSelect);
                selectedValue = frameSelect.value;
            }
            // get the selected option element, and click it, then wait
            await getFrameSelectAndOptions();
            let oldValue = selectedValue;

            await clickOptionElement(tileListItem);

            //get the selected option and elements again, and check the select's value
            await getFrameSelectAndOptions();

            //expect the option element to be a different element now
            expect(
                selectedValue,
                "Selected frame Value should have changed"
            ).to.not.equal(oldValue);

            // await getConfigData();

            const frameTileID = selectedValue;
            const artTileID = tileListItem.dataset.id;

            const frameTileListItem = configElement[0].querySelector(
                `.tile-list-item[data-id='${frameTileID}']`
            );

            //TODO - uncomment the below code, and test the border color upon hover
            // dispatchEvent(tileListItem, MouseEvent, "mouseover");
            // await quench.utils.pause(100);

            // let artBorderColor = returnComputedStyles(tileListItem, "", "border-color");
            // let frameBorderColor = returnComputedStyles(
            //     frameTileListItem,
            //     "",
            //     "border-color"
            // );

            // test that the Art Tile fits within the designated Frame Tile
            const url =
                "https://images.pexels.com/photos/934067/pexels-photo-934067.jpeg";

            //update the art tile, and see if it fits within the frame tile now
            await ImageDisplayManager.updateTileObjectTexture(
                artTileID,
                frameTileID,
                url,
                "anyScene"
            );

            let { artArea, frameArea } = await testFitToFrame(frameTileID, artTileID);
            expect(
                artArea,
                "The art area should be smaller than the frame area"
            ).to.be.below(frameArea);
        });
    });
};

const settingsToggleTest = () => {};

Hooks.on("quenchReady", async (quench) => {
    quench.registerBatch(
        "Slideshow Config Test",
        async (context) => {
            await slideshowConfigTest(context);
        },
        { displayName: "QUENCH: SlideshowConfig Test Suite" }
    );
    quench.registerBatch(
        "Sheet image display test",
        async (context) => {
            await sheetImageDisplayTest(context);
        },
        { displayName: "QUENCH: Image Display Test Suite" }
    );
    quench.registerBatch(
        "Config Unlinked Test",
        async (context) => {
            await unlinkedTilesTest(context);
        },
        { displayName: "QUENCH: Unlinked tiles test" }
    );
});
