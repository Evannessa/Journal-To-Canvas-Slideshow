import { SlideshowConfig } from "../SlideshowConfig.js";
// import { slideshowDefaultSettingsData } from "../data/SlideshowConfigActions.js";
import { HelperFunctions } from "./HelperFunctions.js";
import { ArtTileManager } from "./ArtTileManager.js";

Hooks.on("quenchReady", async (quench) => {
    quench.registerBatch("Slideshow Config Test", async (context) => {
        const { describe, it, assert, expect, should } = context;
        describe("Slideshow Config Test Suite", async function () {
            describe("Testing Gallery Tile Item Actions", async function () {
                let con = new SlideshowConfig();
                await con._render(true);
                // await quench.utils.pause(1000);
                let element = con.element;
                const scene = game.scenes.viewed;
                const tileID = await ArtTileManager.getDefaultArtTileID(scene);
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

                function combine(actionName) {
                    let string = `${tileItemPrefixString}${actionName}']`;
                    return string;
                }
                async function toggleOverflowMenu() {
                    await clickActionButton("toggleOverflowMenu", ourTileElement);
                    // const actionName = "toggleOverflowMenu";
                    // const actionQueryString = combine(actionName);
                    // ourButton = ourTileElement.querySelector(actionQueryString);
                    // ourButton.click();
                    // await quench.utils.pause(900);
                    overflowMenu = element[0].querySelector(".popover");
                    console.log(overflowMenu);
                }
                it("Tests that the overflow menu renders with the appropriate actions", async function () {
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

                it("Tests that the tile is selected when the 'Select Tile' action is clicked", async function () {
                    await clickActionButton("selectTile");

                    const layerName = game.version >= 10 ? "tiles" : "background";
                    const selectedTileID = canvas[layerName].controlled[0].id;
                    expect(selectedTileID).to.equal(tileID);
                });
            });
        }),
            { displayName: "QUENCH: SlideshowConfig Test Suite" };
    });
});
