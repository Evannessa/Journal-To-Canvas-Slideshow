import { SlideshowConfig } from "../SlideshowConfig.js";
// import { slideshowDefaultSettingsData } from "../data/SlideshowConfigActions.js";
import { HelperFunctions } from "./HelperFunctions.js";
import { ArtTileManager } from "./ArtTileManager.js";

Hooks.on("renderSlideshowConfig", () => {});
Hooks.on("quenchReady", async (quench) => {
    quench.registerBatch(
        "Slideshow Config Test",
        async (context) => {
            const { describe, it, assert, expect, should } = context;

            describe("Slideshow Config Test Suite", async function () {
                describe("Testing Gallery Tile Item Actions", async function () {
                    // it("Tests that the gallery renders", async function () {
                    //     console.log("Config is", config);
                    //     let element = config.element;
                    //     quench.utils.pause(3900);

                    //     assert.notEqual(
                    //         element,
                    //         undefined,
                    //         "element shouldn't be undefined"
                    //     );
                    //     assert.notEqual(
                    //         element.length,
                    //         0,
                    //         "length should be grater than zero"
                    //     );
                    // });
                    // get tile Item id
                    const scene = game.scenes.viewed;
                    const tileID = await ArtTileManager.getDefaultArtTileID(scene);
                    const tileItemPrefixString =
                        "[data-action='itemActions.click.actions.";
                    function combine(actionName) {
                        let string = `${tileItemPrefixString}${actionName}']`;
                        console.log(string);
                        return string;
                    }
                    it("Tests that the overflow menu renders with the appropriate actions", async function () {
                        let con = new SlideshowConfig();
                        await con._render(true);
                        quench.utils.pause(3900);
                        // let element = con.element;
                        let element = con.element;
                        const actionName = "toggleOverflowMenu";
                        const actionQueryString = combine(actionName);
                        const ourTileElement = $(element).find(
                            `.tile-list-item[data-is-default]`
                        )[0];
                        assert.notEqual(
                            ourTileElement,
                            undefined,
                            "Our tile element should be defined"
                        );
                        const ourButton = ourTileElement.querySelector(actionQueryString);
                        ourButton.click();
                        quench.utils.pause(300);
                        const overflowMenu = element.find(".popover")[0];
                        assert.ok(overflowMenu !== undefined, "Overflow menu exists");

                        it("Tests that the tile is selected when the 'Select Tile' action is clicked", async function () {
                            const layerName = game.version >= 10 ? "tiles" : "background";
                            const selectedTileID = canvas[layerName].controlled[0].id;
                            expect(selectedTileID).to.equal(tileID);
                            // - & Select Tile Button
                            // - ~ Active Tools are Changed
                            // - $  Appropriate Tile is selected - this is all that really matters
                        });
                    });
                    it("Tests that the config is rendered when the button's clicked", async function () {
                        quench.utils.pause(300);
                    });
                });
            });
        },
        { displayName: "QUENCH: SlideshowConfig Test Suite" }
    );
});
