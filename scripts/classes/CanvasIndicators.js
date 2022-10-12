import { ArtTileManager } from "./ArtTileManager.js";
import { HelperFunctions } from "./HelperFunctions.js";

export class CanvasIndicators {
    static async setUpIndicators(foundTileData, tileDoc) {
        if (!tileDoc) {
            ui.notifications.error("No tile doc was provided.");
            return;
        }
        let type = "unlinked";

        if (foundTileData) {
            type = foundTileData.isBoundingTile ? "frame" : "art";
            const defaultTileID = await ArtTileManager.getDefaultArtTileID();
            if (foundTileData.id === defaultTileID) {
                type = "default";
            }
        }
        await CanvasIndicators.createTileIndicator(tileDoc, type);
        await CanvasIndicators.hideTileIndicator(tileDoc);
    }

    static async getColors() {
        let colors = {};
        let settingsColors = await HelperFunctions.getSettingValue(
            "artGallerySettings",
            "indicatorColorData.colors"
        );
        colors.frameTileColor = settingsColors.frameTileColor || "#ff3300";
        colors.artTileColor = settingsColors.artTileColor || "#2f2190";
        colors.unlinkedTileColor = settingsColors.unlinkedTileColor || "#a2ff00";
        colors.defaultTileColor = settingsColors.defaultTileColor || "#e75eff";
        return colors;
    }

    /**
     * for v10, create an indicator that better reflects the image
     * @author TheRipper93 (original author)
     * @author Eva (added small changes better to fit module)
     * https://github.com/theripper93/tile-sort/blob/master/scripts/main.js
     * @returns - the created sprite
     */
    static createV10Indicator(tile, fillAlpha, color) {
        let tileImg = tile.mesh;
        if (!tileImg || !tileImg.texture.baseTexture) return;
        let sprite = new PIXI.Sprite.from(tileImg.texture);
        sprite.isSprite = true;
        sprite.width = tile.document.width;
        sprite.height = tile.document.height;
        sprite.angle = tileImg.angle;
        sprite.alpha = fillAlpha;
        sprite.tint = color;
        sprite.name = "tilesorthighlight";
        return sprite;
    }
    static async createTileIndicator(tileDocument, type = "art") {
        if (!tileDocument) {
            ui.notifications.warn("Tile document not supplied.");
            return;
        }
        //add check for if it's v10
        const isV10 = game.version >= 10 ? true : false;
        let tileDimensions = {
            width: isV10 ? tileDocument.width : tileDocument.data.width,
            height: isV10 ? tileDocument.height : tileDocument.data.height,
            x: isV10 ? tileDocument.x : tileDocument.data.x,
            y: isV10 ? tileDocument.y : tileDocument.data.y,
        };
        let tileObject = tileDocument.object;
        if (!tileObject) {
            return;
        }

        if (tileObject && tileObject.overlayContainer) {
            //destroy the overlayContainer PIXI Container stored on the tileObject
            tileObject.overlayContainer.destroy();

            //delete the property itself that was storing it
            delete tileObject.overlayContainer;
        }
        let colors = await CanvasIndicators.getColors();
        let color;
        let fillAlpha = 0.5;
        let lineWidth;
        switch (type) {
            case "frame":
                color = colors.frameTileColor;
                lineWidth = 15;
                break;
            case "art":
                color = colors.artTileColor;
                lineWidth = 5;
                break;
            case "unlinked":
                color = colors.unlinkedTileColor;
                lineWidth = 15;
                break;
            case "default":
                color = colors.defaultTileColor;
                lineWidth = 15;
                break;
        }
        color = color.substring(1);
        if (color.length === 8) {
            color = HelperFunctions.hex8To6(color); //.substring(-2);
        }
        color = `0x${color}`;

        tileObject.overlayContainer = tileObject.addChild(new PIXI.Container());

        let overlayGraphic;
        let overlaySprite;
        if (game.version >= 10 && (type === "art" || type === "default")) {
            overlaySprite = CanvasIndicators.createV10Indicator(
                tileObject,
                fillAlpha,
                color
            );
            tileObject.overlayContainer.addChild(overlaySprite);
        }
        overlayGraphic = new PIXI.Graphics();
        const whiteColor = 0xffffff;
        fillAlpha = overlaySprite ? 0.25 : 0.5;
        overlayGraphic.beginFill(whiteColor, fillAlpha);
        overlayGraphic.lineStyle(lineWidth, color, 1);
        overlayGraphic.tint = color;

        overlayGraphic.drawRect(0, 0, tileDimensions.width, tileDimensions.height);
        overlayGraphic.endFill();

        tileObject.overlayContainer.addChild(overlayGraphic);
        tileObject.overlayContainer.alpha = 0;
    }

    static async showTileIndicator(tileDocument, alpha = 1) {
        if (!tileDocument || !tileDocument.object) {
            console.warn("Tile document not supplied.");
            return;
        }
        let tileObject = tileDocument.object;
        if (tileObject.overlayContainer) {
            tileObject.overlayContainer.alpha = alpha;
        } else {
            console.error("No overlay container found");
        }
    }
    static async hideTileIndicator(tileDocument) {
        if (!tileDocument || !tileDocument.object) {
            console.warn("No tile document supplied");
            return;
        }
        let tileObject = tileDocument.object;

        if (tileObject && tileObject.overlayContainer) {
            tileObject.overlayContainer.alpha = 0;
        } else {
            console.error("No overlay container found");
        }
    }
}
