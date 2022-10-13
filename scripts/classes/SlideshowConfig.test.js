import { SlideshowConfig } from "../SlideshowConfig.js";
// import { slideshowDefaultSettingsData } from "../data/SlideshowConfigActions.js";
import { HelperFunctions } from "./HelperFunctions.js";
import { ArtTileManager } from "./ArtTileManager.js";

Hooks.on("quenchReady", async (quench) => {
    quench.registerBatch("Slideshow Config Test", async (context) => {
        const { describe, it, assert, expect, should } = context;
        describe("Slideshow Config Test Suite", async function () {
            describe("Testing Linked Gallery Tile Item Actions in overflow menu", async function () {
                let con = new SlideshowConfig();
                await con._render(true);
                // await quench.utils.pause(1000);
                let element = con.element;
                const scene = game.scenes.viewed;
                const tileID = await ArtTileManager.getDefaultArtTileID(scene);
                const tileData = await ArtTileManager.getGalleryTileDataFromID(tileID);
                const tileItemPrefixString = "[data-action='itemActions.click.actions.";
                const ourTileElement = $(element).find(
                    `.tile-list-item[data-is-default]`
                )[0];

                let overflowMenu;
                let ourButton;
                beforeEach(async () => {
                    await toggleOverflowMenu();
                });
                // afterEach(async () => {
                //     element.click();
                //     await quench.utils.pause(1000);
                // });
                // get tile Item id
                async function clickActionButton(actionName, element = overflowMenu) {
                    const actionQueryString = combine(actionName);
                    ourButton = element.querySelector(actionQueryString);
                    ourButton.click();
                    await quench.utils.pause(900);
                }
                function getAppFromWindow(type) {
                    return Object.values(ui.windows).filter((w) => w instanceof type)[0];
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

                function combine(actionName) {
                    let string = `${tileItemPrefixString}${actionName}']`;
                    return string;
                }
                async function toggleOverflowMenu() {
                    await clickActionButton("toggleOverflowMenu", ourTileElement);
                    overflowMenu = element[0].querySelector(".popover");
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
                });

                it("Updates the tile's dimensions to be within that of its frame tile's dimensions", async () => {
                    assert.fail();
                    // Fit Tile to Frame Button
                    // - ~ Tile dimensions are updated
                    // - $ Tile dimensions are no larger than dimensions of scene (or tile)
                });
                it("resets the Tile Image back to default when Clear Tile Image is clicked", async () => {
                    assert.fail();
                    // & Clear Tile Image Button
                    // - ~ Tile Image now matches 'default' image saved
                });
                it("renders a Delete Data confirmation prompt", async () => {
                    assert.fail();
                    //  "Delete Gallery Tile Data" Button
                    // - ~ Prompt is created, asking if user wants to delete data
                    // ? - & On cancel, dialog closes, nothing happens
                    // ! - & On approve, dialog closes, tile data is deleted
                    // - ~ Scene Config App updates
                    // - ~ IF FRAME, linked Art Tiles default to "Canvas as Frame"
                });
            });
        }),
            { displayName: "QUENCH: SlideshowConfig Test Suite" };
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
});
