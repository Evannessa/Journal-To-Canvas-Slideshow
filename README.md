# ClickImage
Test FoundryVTT Project

Here's some info on how to set things up. Skip to the bottom with the step-by-step if you want to just know how to set up the Display scene.

***Warning***: I'm a noob to Foundry and a mostly self-taught programmer, so this is a hacky and probably inflexible solution. Forgive me if something doesn't work right; I'll try to get it fixed up if I ever officially release this as a module lol.

***General Info about the demo scene:***

So the wood background in my demo video is just the background image of the scene, and the items scattered around are just some static tiles overlaid on top with some art I purchased.

I'm also using Token Magic FX[https://foundryvtt.com/packages/tokenmagic/](https://foundryvtt.com/packages/tokenmagic/) to give a drop shadow to the tile.

***Script explanation***: 

The real 'magic' basically surrounds a single tile. Each time I click on an image in the journal, the tile's image source is updated with the source changed to that of the image in the journal that I clicked on.  

The script basically goes through the images in a journal entry when it renders, adds a 'clickable-image' class to them, and then looks through the elements with that class and adds an event handler when they're clicked.

This event handler handles changing the tile's source to that of the image in the journal.

The script also adds button in the scene tab that lets you generate a 'Display' scene and was thinking about adding some configuration options to that, but I haven't figured that part out yet, so I'd avoid using it for now and set up the "Display" scene manually.

There are also some functions in there for some drag-and-drop functionality I was trying to implement. I've commented the functionality out mostly so feel free to ignore those.  

***So here's how to manually set it up your "Display" scene:***

1. Create a new scene, name it "Display" — unsure if this is case sensitive, but I'd capitalize it just to be safe.
2. I'm using a 2000px by 2000px scene, but the script should take the size of the canvas into consideration (I think). 
3. Change the "padding percentage" to zero in the scene configuration options.
4. Once the scene is created, create a single tile on the canvas, with whatever generic image as the source. This will be your display tile. **Note**: The script looks for the very first tile in the scene, so don't add any other tiles before the one that you want to show the journal images.
5. The script will handle positioning and sizing the tile depending on the size of the image and page, so don't worry about that. 
6. Decorate the scene as you see fit, changing the background image and adding extra tiles to make it look however you want. But this first tile you placed will be the only one that changes.

If any more experienced programmers have some tips on how to make this better, please let me know. I do want to release it as an actual module at some point maybe with the display scene included or some configuration options, but I haven't figured out how to do that yet. ^ ^
