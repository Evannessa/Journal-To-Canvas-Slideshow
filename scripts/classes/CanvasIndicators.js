export class CanvasIndicators {
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

        let color = type === "frame" ? 0xff3300 : 0x2f2190;
        let fillAlpha = type === "frame" ? 0.25 : 0.25;
        let lineWidth = type === "frame" ? 5 : 15;
        tileObject.overlayContainer = tileObject.addChild(new PIXI.Container());
        let overlayGraphic = new PIXI.Graphics();
        overlayGraphic.beginFill(color, fillAlpha);
        overlayGraphic.lineStyle(lineWidth, color, 1);
        overlayGraphic.drawRect(0, 0, tileDimensions.width, tileDimensions.height);
        overlayGraphic.endFill();
        tileObject.overlayContainer.addChild(overlayGraphic);
        overlayGraphic.zIndex = 2000;
        // overlayGraphic.alpha = alpha;
    }

    static showTileIndicator(tileDocument) {
        if (!tileDocument) {
            console.warn("Tile document not supplied.");
            return;
        }
        let tileObject = tileDocument.object;
        if (tileObject.overlayContainer) {
            tileObject.overlayContainer.alpha = 1;
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
