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

        let sheetGlobalActionStrings = ["togglelmageControls", "openSlideshowConfig", "openSettingsApp", "fadeJournal"];

        /**
         * set the sheet data from the test journal
         */
        async function getSheetData() {
            sheetControls = getChildElements(sheetElement, sheetControlsSelector);

            imageControls = getChildElements(sheetElement, imageControlsSelector, true);


            clickableImageContainers = getChildElements(sheetElement, clickableContainerSelector, true);
            ourImageContainer = clickableImageContainers[1];
            console.log(sheetElement, clickableImageContainers)
        }

        before(async () => {
            let sourceScene = await initializeScene("Premade Gallery Scene");
            scene = await duplicateTestScene(sourceScene);
            // sheetApp = await game.journal.getName("Art").sheet._render(true);
            // sheetApp = await game.journal.getName("Art").sheet.render(true);
            sheetApp = await game.journal.getName("Test").sheet.render(true);
            await quench.utils.pause(900);
            sheetElement = sheetApp.element;
            await getSheetData();
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
            artScene = game.scenes.get(artSceneID);
            artJournal = game.scenes.get(artJournalID);
        }
        describe("Testing individual image controls", async function () {
            let ourImage;
            let src;
            let displayMethod = "window";
            const clickImageControlButton = async () => {
                ourImageContainer.querySelector(`[data-method='${displayMethod}']`).click();
                await quench.utils.pause(900);
            };
            async function compareWindowContent(type, displayMethodAppName, searchText = "") {
                let windowApp = getAppFromWindow(type, searchText);
                let windowElement = windowApp.element;
                assert.exists(windowElement[0]);
                let windowImageSrc = windowElement[0].querySelector("img")?.getAttribute("src");

                if (game.version < 10 && displayMethodAppName.toLowerCase().includes("journal"))
                    windowImageSrc = returnComputedStyles(windowElement[0], ".lightbox-image", "background-image");
                // windowImageSrc = getComputedStyle(
                //     windowElement[0].querySelector(".lightbox-image")
                // ).getPropertyValue("background-image");
                let message = `${displayMethodAppName} src should equal clicked image src`;
                if (game.version >= 10) expect(windowImageSrc, message).to.equal(src);
                else expect(windowImageSrc, message).to.have.string(src);
                windowApp.close();
            }
            async function compareTileContent(ourScene) {
                let defaultArtTileID = await ArtTileManager.getDefaultArtTileID(ourScene);
                let tileDoc = await getTileObject(defaultArtTileID, ourScene.id);
                let textureProperty = game.version >= 10 ? "texture.src" : "img";
                let tileSrc = await getDocData(tileDoc, textureProperty);
                expect(tileSrc, `${displayMethod} image src should equal clicked image src`).to.equal(src);
            }
            before(async () => {
                await getDefaultDisplayIDs();
                console.log(ourImageContainer) 
                ourImage = ourImageContainer.querySelector("img");
                src = ourImage.getAttribute("src");
            });
            let doBeforeEach = clickImageControlButton;
            beforeEach(doBeforeEach);
            afterEach(async () => {
                await getSheetData();
            });
            it("Renders a popout window with the apporpriate image", async () => {
                await compareWindowContent(ImagePopout, "ImagePopout");
                displayMethod = "journalEntry";
            });
            it("Renders the art journal sheet with the appropriate image", async () => {
                await compareWindowContent(JournalSheet, "Art Journal", "Display Journal");
                // //TODO: Ensure the id of this journal entry matches the Art Journal entry

                displayMethod = "artScene";
            });
            it("Updates the default Art Tile in the Art Scene with the appropriate image", async () => {
                await compareTileContent(artScene);
                displayMethod = "anyScene";
            });
            it("Updates the default Art Tile in the current scene with the appropriate image", async () => {
                let tiles = scene.tiles.contents;
                // compare the slideshow tiles to the tiles that are in the display
                let buttons = Array.from(ourImageContainer.querySelectorAll(".displayTiles button"));

                for (let button of buttons) {
                    button.click();
                    let id = button.dataset.id;
                    await quench.utils.pause(200);
                    let tile = tiles.find((tile) => tile.id === id);
                    let textureProperty = game.version >= 10 ? "texture.src" : "img";
                    let tileSrc = await getDocData(tile, textureProperty);
                    let imgSrc = ourImage.getAttribute("src");
                    expect(tileSrc, "Tile path should equal image path").to.equal(imgSrc);
                }

                displayMethod = "anyScene";
            });
            doBeforeEach = async () => {
                ourImage.click();
                await quench.utils.pause(900);
            };
            it("Updates the Art Tile associated with the particular sheet image", async () => {
                await compareTileContent(game.scenes.viewed);
            });
        });
    });
}
