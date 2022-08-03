export class CanvasIndicators {
    static createTileIndicator(tileDocument, type = "art") {
        if (!tileDocument) {
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
        tileObject.overlayContainer = tileObject.addChild(new PIXI.Container());
        let overlayGraphic = new PIXI.Graphics();
        overlayGraphic.beginFill(color, 0.8);
        overlayGraphic.lineStyle(5, color, 1);
        overlayGraphic.drawRect(0, 0, tileDimensions.width, tileDimensions.height);
        overlayGraphic.endFill();
        tileObject.overlayContainer.addChild(overlayGraphic);
        overlayGraphic.zIndex = 2000;
        overlayGraphic.alpha = 0.25;
    }

    static showTileIndicator(tileDocument) {
        if (!tileDocument) {
            return;
        }
        let tileObject = tileDocument.object;
        tileObject.overlayContainer.alpha = 1;
    }
    static hideTileIndicator(tileDocument) {
        if (!tileDocument) {
            return;
        }
        let tileObject = tileDocument.object;
        tileObject.overlayContainer.alpha = 0;
    }
    static deleteTileIndicator(tileDocument) {}
}