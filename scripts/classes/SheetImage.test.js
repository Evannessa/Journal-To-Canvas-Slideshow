import { HelperFunctions } from "./HelperFunctions";

Hooks.on("quenchReady", async (quench) => {
    quench.registerBatch("Sheet Image Display Test", async (context) => {
        const { describe, it, assert, expect, should } = context;
        before(() => {
            game.journal.getName("Art").render(true);
        });
        async function getDefaultDisplayIDs() {
            let artSceneID = await HelperFunctions.getSettingValue(
                "artGallerySettings",
                "dedicatedDisplayData.scene.value"
            );
            let artJournalID = await HelperFunctions.getSettingValue(
                "artGallerySettings",
                "dedicatedDisplayData.journal.value"
            );
        }
        describe("Sheet image display suite", async function () {
            describe("Testing image sheets", async function () {
                it("Renders a popout window with the apporpriate image", async () => {
                    assert.fail();
                });
                it("Renders the art journal sheet with the appropriate image", async () => {
                    assert.fail();
                });
                it("Updates the default Art Tile in the Art Scene with the appropriate image", () => {
                    assert.fail();
                });
                it("Updates the default Art Tile in the current scene with the appropriate image", () => {
                    assert.fail();
                });
                it("Updates the Art Tile associated with the particular sheet button", () => {
                    assert.fail();
                });
            });
        });
    });
});
