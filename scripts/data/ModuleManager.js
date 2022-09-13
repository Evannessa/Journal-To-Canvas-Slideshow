import { ArtTileManager } from "../classes/ArtTileManager.js";
import { CanvasIndicators } from "../classes/CanvasIndicators.js";
import { HelperFunctions } from "../classes/HelperFunctions.js";
import { ImageDisplayManager } from "../classes/ImageDisplayManager.js";
import ImageVideoPopout from "../classes/MultiMediaPopout.js";
import { SheetImageApp } from "../SheetImageApp.js";
import { SheetImageDataController } from "../SheetImageDataController.js";
import { SlideshowConfig } from "../SlideshowConfig.js";

const JTCSModules = {
    ArtTileManager,
    CanvasIndicators,
    HelperFunctions,
    ImageDisplayManager,
    ImageVideoPopout,
    // SheetImageApp,
    SheetImageDataController,
    SlideshowConfig,
};
export const {
    artTileManager,
    canvasIndicatorManager,
    helpers,
    imageDisplayManager,
    sheetImageApp,
    sheetImageDataController,
    slideshowConfig,
} = JTCSModules;
