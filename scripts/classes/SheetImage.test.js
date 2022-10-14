import { HelperFunctions } from "./HelperFunctions.js";
import { TestUtils } from "../tests/test-utils.js";
import { ArtTileManager } from "./ArtTileManager.js";

export async function sheetImageDisplayTest(context) {
    const { describe, it, assert, expect, should } = context;

    describe("Sheet image display suite", async function () {
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
            getChildElements,
            clickButton,
            clickActionButton,
        } = TestUtils;

        let sheetApp,
            sheetElement,
            scene,
            sheetControls,
            imageControls,
            clickableImageContainers,
            ourImageContainer,
            artJournal,
            artScene;
        const clickableContainerSelector = ".clickableImageContainer";
        const imageControlsSelector = ".clickableImageControls";
        const sheetControlsSelector = "#sheet-controls";

        let sheetGlobalActionStrings = [
            "togglelmageControls",
            "openSlideshowConfig",
            "openSettingsApp",
            "fadeJournal",
        ];

        before(async () => {
            let sourceScene = await initializeScene();
            scene = await duplicateTestScene(sourceScene);
            // sheetApp = await game.journal.getName("Art").sheet._render(true);
            sheetApp = await game.journal.getName("Art").sheet.render(true);
            await quench.utils.pause(900);
            sheetElement = sheetApp.element;

            sheetControls = getChildElements(sheetElement, sheetControlsSelector);

            imageControls = getChildElements(sheetElement, imageControlsSelector, true);

            clickableImageContainers = getChildElements(
                sheetElement,
                clickableContainerSelector,
                true
            );
            ourImageContainer = clickableImageContainers[0];
        });

        after(async () => {
            await deleteTestScene(scene);
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
            console.log(artSceneID, artJournalID);
            artScene = game.scenes.get(artSceneID);
            artJournal = game.scenes.get(artJournalID);
        }
        describe("Testing individual image controls", async function () {
            let ourImage;
            let src;
            let displayMethod = "window";
            async function compareWindowContent(
                type,
                displayMethodAppName,
                searchText = ""
            ) {
                let windowApp = getAppFromWindow(type, searchText);
                let windowElement = windowApp.element;
                assert.exists(windowElement[0]);
                let windowImageSrc = windowElement[0]
                    .querySelector("img")
                    .getAttribute("src");
                expect(
                    windowImageSrc,
                    `${displayMethodAppName} src should equal clicked image src`
                ).to.equal(src);
            }
            async function compareTileContent(ourScene) {
                console.log(artScene);
                let defaultArtTileID = await ArtTileManager.getDefaultArtTileID(ourScene);
                let tileDoc = await getTileObject(defaultArtTileID, ourScene.id);
                let tileSrc = await getDocData(tileDoc, "texture.src");
                expect(
                    tileSrc,
                    `${displayMethod} image src should equal clicked image src`
                ).to.equal(src);
            }
            before(async () => {
                await getDefaultDisplayIDs();
                console.log(artScene, artJournal);
                ourImage = ourImageContainer.querySelector("img"); //getChildElements(ourImageContainer, "img");

                src = ourImage.getAttribute("src");
            });
            beforeEach(async () => {
                ourImageContainer
                    .querySelector(`[data-method='${displayMethod}']`)
                    .click();
                await quench.utils.pause(900);
            });
            it("Renders a popout window with the apporpriate image", async () => {
                await compareWindowContent(ImagePopout, "ImagePopout");
                // let popoutApp = getAppFromWindow(ImagePopout);
                // let popoutElement = popoutApp.element;
                // assert.exists(popoutElement[0]);
                // let popoutImageSrc = popoutElement[0]
                //     .querySelector("img")
                //     .getAttribute("src");
                // expect(
                //     popoutImageSrc,
                //     "Popout image src should equal clicked image src"
                // ).to.equal(src);
                // assert.fail();
                displayMethod = "journalEntry";
            });
            it("Renders the art journal sheet with the appropriate image", async () => {
                await compareWindowContent(
                    JournalSheet,
                    "Art Journal",
                    "Display Journal"
                );
                // let popoutApp = getAppFromWindow(JournalSheet, "Display Journal");
                // //TODO: Ensure the id of this journal entry matches the Art Journal entry
                // let popoutElement = popoutApp.element;
                // assert.exists(popoutElement[0]);
                // let popoutImageSrc = popoutElement[0]
                //     .querySelector("img")
                //     .getAttribute("src");
                // expect(
                //     popoutImageSrc,
                //     "Art Journal image src should equal clicked image src"
                // ).to.equal(src);
                displayMethod = "artScene";
            });
            it("Updates the default Art Tile in the Art Scene with the appropriate image", async () => {
                await compareTileContent(artScene);

                // let artSceneDefaultTileID = await ArtTileManager.getDefaultArtTileID(
                //     artScene
                // );
                // let tileDoc = await getTileObject(artSceneDefaultTileID, artScene.id);
                // let tileSrc = await getDocData(tileDoc, "texture.src");
                // expect(
                //     tileSrc,
                //     "Art Journal image src should equal clicked image src"
                // ).to.equal(src);
                displayMethod = "anyScene";
            });
            it("Updates the default Art Tile in the current scene with the appropriate image", async () => {
                await compareTileContent(game.scenes.viewed);
                // let defaultTileID = await ArtTileManager.getDefaultArtTileID(
                //     game.scenes.viewed
                // );
                // let tileDoc = await getTileObject(defaultTileID);
                // assert.fail();
                displayMethod = "anyScene";
            });
            it("Updates the Art Tile associated with the particular sheet image", () => {
                assert.fail();
            });
        });
    });
}
