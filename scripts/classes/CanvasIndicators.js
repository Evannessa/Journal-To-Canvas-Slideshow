export class CanvasIndicators {
    //add flag to update indicator colors in scene
    static async updateSceneColors() {}

    //add flag to update indicator colors for user
    static async updateUserColors() {}
    static async setUpIndicators(foundTileData, tileDoc) {
        if (!tileDoc) {
            ui.notifications.error("No tile doc was provided.");
            return;
        }
        let type = "unlinked";
        if (foundTileData) {
            type = foundTileData.isBoundingTile ? "frame" : "art";
        }
        await game.JTCS.indicatorUtils.createTileIndicator(tileDoc, type);
        await game.JTCS.indicatorUtils.hideTileIndicator(tileDoc, type);
    }

    static getColors() {
        let colors = {};
        // let colors = { ...game.settings.get("journal-to-canvas-slideshow", "tileIndicatorColors") };
        colors.artTileColor = 0xff3300;
        colors.frameTileColor = 0x2f2190;
        colors.unlinkedTileColor = 0xff33;
        return colors;
    }
    static createTileIndicator(tileDocument, type = "art") {
        if (!tileDocument) {
            ui.notifications.warn("Tile document not supplied.");
            return;
        }
        let tileDimensions = {
            width: tileDocument.data.width,
            height: tileDocument.data.height,
            x: tileDocument.data.x,
            y: tileDocument.data.y,
        };
        let tileObject = tileDocument.object;

        if (tileObject.overlayContainer) {
            //destroy the overlayContainer PIXI Container stored on the tileObject
            tileObject.overlayContainer.destroy();

            //delete the property itself that was storing it
            delete tileObject.overlayContainer;
        }
        let colors = CanvasIndicators.getColors();
        if (!colors) {
        }
        let color;
        let fillAlpha;
        let lineWidth;
        switch (type) {
            case "frame":
                color = colors.frameTileColor;
                fillAlpha = 0.5;
                lineWidth = 15;
                break;
            case "art":
                color = colors.artTileColor;
                fillAlpha = 0.5;
                lineWidth = 5;
                break;
            case "unlinked":
                color = colors.unlinkedTileColor;
                fillAlpha = 0.5;
                lineWidth = 15;
            case "default":
                break;
        }

        tileObject.overlayContainer = tileObject.addChild(new PIXI.Container());
        let overlayGraphic = new PIXI.Graphics();
        overlayGraphic.beginFill(color, fillAlpha);
        overlayGraphic.lineStyle(lineWidth, color, 1);
        overlayGraphic.drawRect(0, 0, tileDimensions.width, tileDimensions.height);
        overlayGraphic.endFill();
        tileObject.overlayContainer.addChild(overlayGraphic);
        overlayGraphic.zIndex = 2000;
        if (type === "art") overlayGraphic.zIndex = 2100;
        // overlayGraphic.alpha = alpha;
    }

    static showTileIndicator(tileDocument, alpha = 1) {
        if (!tileDocument) {
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
    static hideTileIndicator(tileDocument) {
        if (!tileDocument) {
            console.error("No tile document supplied");
            return;
        }
        let tileObject = tileDocument.object;

        if (tileObject.overlayContainer) {
            tileObject.overlayContainer.alpha = 0;
        } else {
            console.error("No overlay container found");
        }
    }
    static deleteTileIndicator(tileDocument) {}
}
