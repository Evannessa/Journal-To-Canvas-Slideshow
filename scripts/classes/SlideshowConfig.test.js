import { SlideshowConfig } from "../SlideshowConfig.js";
import { HelperFunctions } from "./HelperFunctions.js";
import { ArtTileManager } from "./ArtTileManager.js";
import { ImageDisplayManager } from "./ImageDisplayManager.js";

Hooks.on("quenchReady", async (quench) => {
    quench.registerBatch(
        "Slideshow Config Test",
        async (context) => {
            const { describe, it, assert, expect, should } = context;
            describe("Slideshow Config Test Suite", async function () {
                describe("Testing Linked Gallery Tile Item Actions in overflow menu", async function () {
                    let con,
                        element,
                        scene,
                        dupedScene,
                        tileID,
                        tileData,
                        tileDoc,
                        tileItemPrefixString,
                        ourTileElement,
                        defaultImageSrc,
                        overflowMenu,
                        ourButton;

                    // let testData = {};
                    // let con = new SlideshowConfig();
                    // await con._render(true);
                    // let element = con.element;
                    // let scene = game.scenes.viewed;
                    // let dupedScene;
                    // const tileID = await ArtTileManager.getDefaultArtTileID(scene);
                    // const tileData = await ArtTileManager.getGalleryTileDataFromID(
                    //     tileID
                    // );
                    // const tileDoc = await getTileObject(tileID);
                    // const tileItemPrefixString =
                    //     "[data-action='itemActions.click.actions.";
                    // const ourTileElement = $(element).find(
                    //     `.tile-list-item[data-is-default]`
                    // )[0];
                    // const defaultImageSrc = await getArtGallerySettings(
                    //     "defaultTileImages.paths.artTilePath"
                    // );
                    // let overflowMenu;
                    // let ourButton;
                    before(async () => {
                        let sourceScene = game.scenes.getName("Display");
                        await sourceScene.view();
                        await duplicateTestScene(sourceScene);
                        await getTestData();
                    });
                    beforeEach(async () => {
                        await toggleOverflowMenu();
                        await changeTileImage(defaultImageSrc);
                    });

                    after(async () => {
                        await deleteTestScene();
                    });

                    /**
									* clone scene and activate it
									@returns duplicated scene
								    */
                    async function duplicateTestScene(sourceScene) {
                        let dupedSceneData = sourceScene.clone({
                            name: "Test Scene",
                        });
                        scene = await Scene.create(dupedSceneData);
                        await scene.activate();
                        await scene.view();
                    }
                    async function getTestData() {
                        con = new SlideshowConfig();
                        await con._render(true);
                        element = con.element;
                        tileID = await ArtTileManager.getDefaultArtTileID(scene);
                        tileData = await ArtTileManager.getGalleryTileDataFromID(tileID);
                        tileDoc = await getTileObject(tileID);
                        tileItemPrefixString = "[data-action='itemActions.click.actions.";
                        ourTileElement = $(element).find(
                            `.tile-list-item[data-is-default]`
                        )[0];
                        defaultImageSrc = await getArtGallerySettings(
                            "defaultTileImages.paths.artTilePath"
                        );
                    }
                    async function deleteTestScene() {
                        let dupedSceneId = dupedScene.id;
                        await Scene.deleteDocuments([dupedSceneId]);
                    }

                    // get tile Item id
                    async function clickActionButton(actionName, element = overflowMenu) {
                        const actionQueryString = combine(actionName);
                        await clickButton(element, actionQueryString);
                        // ourButton = element.querySelector(actionQueryString);
                        // ourButton.click();
                        // await quench.utils.pause(900);
                    }
                    async function clickButton(element, selector) {
                        ourButton = element.querySelector(selector);
                        ourButton.click();
                        await quench.utils.pause(900);
                    }
                    async function getArtGallerySettings(nestedPropertyString = "") {
                        let settings = await HelperFunctions.getSettingValue(
                            "artGallerySettings",
                            nestedPropertyString
                        );
                        return settings;
                    }
                    function getAppFromWindow(type) {
                        return Object.values(ui.windows).filter(
                            (w) => w instanceof type
                        )[0];
                    }
                    function getDocIdFromApp(app) {
                        return app.document.id;
                    }
                    async function getFameTileData() {
                        let frameTileID = tileData.linkedBoundingTile;
                        let frameTileData = await ArtTileManager.getGalleryTileDataFromID(
                            frameTileID
                        );
                        return frameTileData;
                    }
                    async function getTileObject(tileID) {
                        let tileObject = await ArtTileManager.getTileObjectByID(tileID);
                        return tileObject;
                    }
                    async function getDocData(document, property = "") {
                        let data = game.version >= 10 ? document : document.data;
                        if (property) {
                            return foundry.utils.getProperty(data, property);
                        } else {
                            return data;
                        }
                    }
                    async function resizeTile(tileDoc) {
                        //give it random dimensions bigger than scene
                        let width = (await getDocData(scene, "width")) + 30;
                        let height = (await getDocData(scene, "height")) + 30;
                        let updateData = {
                            _id: tileDoc.id,
                            width,
                            height,
                        };
                        await scene.updateEmbeddedDocuments("Tile", [updateData]);
                    }
                    async function getDimensions(doc) {
                        let width = await getDocData(doc, "width");
                        let height = await getDocData(doc, "height");
                        return {
                            width,
                            height,
                        };
                    }
                    async function getAreasOfDocs(frameDoc, artTileDoc) {
                        const frameDimensions = await getDimensions(frameDoc);
                        const frameArea = frameDimensions.width * frameDimensions.height;

                        const artDimensions = await getDimensions(artTileDoc);
                        const artArea = artDimensions.width * artDimensions.height;
                        return { artArea, frameArea };
                    }
                    /**
                     * change the tile's image to a test image
                     */
                    async function changeTileImage(url = "") {
                        if (!url)
                            url =
                                "/modules/journal-to-canvas-slideshow/demo-images/pd19-20049_1.webp";
                        await ImageDisplayManager.updateTileObjectTexture(
                            tileID,
                            "",
                            url,
                            "anyScene"
                        );
                    }
                    function combine(actionName) {
                        let string = `${tileItemPrefixString}${actionName}']`;
                        return string;
                    }
                    async function toggleOverflowMenu() {
                        await clickActionButton("toggleOverflowMenu", ourTileElement);
                        overflowMenu = element[0].querySelector(".popover");
                        return overflowMenu;
                    }
                    it("renders the overflow menu when the 'toggle overflow menu'", async function () {
                        // const actionName = "toggleOverflowMenu";
                        // const actionQueryString = combine(actionName);
                        assert.notEqual(
                            ourTileElement,
                            undefined,
                            "Our tile element should be defined"
                        );
                        // const ourButton = ourTileElement.querySelector(actionQueryString);
                        // ourButton.click();
                        // await quench.utils.pause(900);
                        // const overflowMenu = element[0].querySelector(".popover");
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
                        await resizeTile(tileDoc);

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
                        await changeTileImage();

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
                        await app.close();
                    });
                    it("closes the dialog button on cancel", async () => {
                        // ? - & On cancel, dialog closes, nothing happens
                        let { dialogElement } = await clickDeleteTileDataButton();
                        await clickButton(dialogElement[0], ".dialog-button.cancel");
                        //app should be undefined now after cancel is clicked
                        let app = getAppFromWindow(Dialog);
                        assert.isUndefined(app);
                    });
                    it("deletes the tile data on 'Delete'", async () => {
                        // ! - & On approve, dialog closes, tile data is deleted
                        await toggleOverflowMenu();
                        let { dialogElement } = await clickDeleteTileDataButton();
                        await clickButton(dialogElement[0], ".dialog-button.delete");
                        // - ~ Scene Config App updates
                        let sceneTiles = await ArtTileManager.getSceneSlideshowTiles(
                            "art",
                            true
                        );
                        let ourTile = sceneTiles.find((tile) => (tile.id = tileID));
                        console.log(sceneTiles, ourTile);
                        // - ~ IF FRAME, linked Art Tiles default to "Canvas as Frame"
                    });
                });

                describe("when the item actions not within the overflow menu are clicked", async () => {
                    it("renders the SHARE URL IMAGE popover box", async () => {
                        assert.fail();
                        // & "Share URL Image"
                        // - ~ Popover appears with Input Box and receives focus, allowing user to enter url into box
                        // 	- & On Change
                        // 		- ~ Submits.
                        // 			- $ Specific tile in scene's image source should now equal submitted image url
                        // 		- ! If not valid URL, notification appears warning user that is invalid
                        // 	- & Enter Pressed while focused
                        // 		- ~ Submits
                        // 			- $ Specific tile in scene's image source should now equal submitted image url
                        // 		- ! If not valid URL, notification appears warning user that is invalid
                    });
                    it("fades out other tiles in the scene", () => {
                        assert.fail();
                        // ~ Opacity  of other tiles in scene is faded
                        //! - ! 🐜 Not working in V10
                        // - $ Button has "Active" styles toggled on
                    });
                    it("sets the tile to be the default tile", () => {
                        assert.fail();
                        // 	Ctrl + Click (Set Default Action)
                        // - ~ Tile is set as default tile in current scene
                        // - ~ Config app re-renders.
                        // 	- $ Tile Item now has color change to match.
                        // - $ Tile Indicator Color changes to match default color  as set in settings
                        // - ~ sheet images are sent to this tile when image clicked (maybe place under "Sheet") section
                    });
                });
            });
        },
        { displayName: "QUENCH: SlideshowConfig Test Suite" }
    );
});
