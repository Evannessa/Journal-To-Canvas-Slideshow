import { SlideshowConfig } from "../SlideshowConfig.js";
import { slideshowDefaultSettingsData } from "../data/SlideshowConfigActions.js";

Hooks.on("quenchReady", (quench) => {
    quench.registerBatch(
        "Slideshow Config Test",
        (context) => {
            const { describe, it, assert, expect, should } = context;
            describe("Slideshow Config Test Suite", function () {
                describe("Testing Slideshow Config", function () {
                    it("Makes sure config is rendered", async function () {
                        // game.JTCSlideshowConfig = await new SlideshowConfig().render(true);
                        // quench.utils.pause(300);
                        // expect(game.JTCSlideshowConfig.rendered).to.equal(true);
                        // game.JTCSlideshowConfig.should.have.property("_element");
                    }),
                        it("Makes sure popover is rendered", async function () {});
                });
            });
        },
        { displayName: "QUENCH: SlideshowConfig Test Suite" }
    );
});
